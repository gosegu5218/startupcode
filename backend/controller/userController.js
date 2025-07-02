const dbConnect = require('../database');
const userModel = require('../model/userModel.js');
const {
    validEmail,
    validNickname,
    validPassword,
} = require('../util/validUtil.js');
const {
    STATUS_CODE,
    STATUS_MESSAGE,
} = require('../util/constant/httpStatusCode.js');

const SALT_ROUNDS = 10;

/**
 * 로그인
 * 회원가입
 * 유저 정보 가져오기
 * 로그인 상태 체크
 * 비밀번호 변경
 * 회원 탈퇴
 * 로그아웃
 * 이메일 중복 체크
 * 닉네임 중복 체크
 */

// 로그인
exports.loginUser = async (request, response, next) => {
    const { email, password } = request.body;

    try {
        if (!email) {
		        const error = new Error(STATUS_MESSAGE.REQUIRED_EMAIL);
		        error.status = STATUS_CODE.BAD_REQUEST;
		        throw error;
		    }
		
		    if (!password) {
		        const error = new Error(STATUS_MESSAGE.REQUIRED_PASSWORD);
		        error.status = STATUS_CODE.BAD_REQUEST;
		        throw error;
		    }
    
        const requestData = {
            email,
            password,
            sessionId: request.sessionID,
        };
        const responseData = await userModel.loginUser(requestData, response);

        if (!responseData || responseData === null) {
            const error = new Error(STATUS_MESSAGE.INVALID_EMAIL_OR_PASSWORD);
            error.status = STATUS_CODE.UNAUTHORIZED;
            throw error;
        }
        return response.status(STATUS_CODE.OK).json({
            message: STATUS_MESSAGE.LOGIN_SUCCESS,
            data: responseData,
        });
    } catch (error) {
        return next(error);
    }
};

// 회원가입
exports.signupUser = async (request, response, next) => {
    const { email, password, nickname, profileImagePath } = request.body;

    try {
        if (!email || !validEmail(email)) {
            const error = new Error(STATUS_MESSAGE.INVALID_EMAIL);
            error.status = STATUS_CODE.BAD_REQUEST;
            throw error;
        }
        if (!nickname || !validNickname(nickname)) {
            const error = new Error(STATUS_MESSAGE.INVALID_NICKNAME);
            error.status = STATUS_CODE.BAD_REQUEST;
            throw error;
        }
        if (!password || !validPassword(password)) {
            const error = new Error(STATUS_MESSAGE.INVALID_PASSWORD);
            error.status = STATUS_CODE.BAD_REQUEST;
            throw error;
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        const reqSignupData = {
            email,
            password: hashedPassword,
            nickname,
            profileImagePath: profileImagePath || null,
        };

        const resSignupData = await userModel.signUpUser(reqSignupData);

        if (resSignupData === 'already_exist_email') {
            const error = new Error(STATUS_MESSAGE.ALREADY_EXIST_EMAIL);
            error.status = STATUS_CODE.BAD_REQUEST;
            throw error;
        }

        if (resSignupData === null) {
            const error = new Error(STATUS_MESSAGE.SIGNUP_FAILED);
            error.status = STATUS_CODE.INTERNAL_SERVER_ERROR;
            throw error;
        }

        return response.status(STATUS_CODE.CREATED).json({
            message: STATUS_MESSAGE.SIGNUP_SUCCESS,
            data: resSignupData,
        });
    } catch (error) {
        return next(error);
    }
};

// 유저 정보 가져오기
exports.getUser = async (request, response, next) => {
    const { user_id: userId } = request.params;

    try {
        if (!userId) {
            const error = new Error(STATUS_MESSAGE.INVALID_USER_ID);
            error.status = STATUS_CODE.BAD_REQUEST;
            throw error;
        }

        const requestData = {
            userId,
        };
        const responseData = await userModel.getUser(requestData);

        if (responseData === null) {
            const error = new Error(STATUS_MESSAGE.NOT_FOUND_USER);
            error.status = STATUS_CODE.NOT_FOUND;
            throw error;
        }

        return response.status(200).json({
            message: null,
            data: responseData,
        });
    } catch (error) {
        return next(error);
    }
};

// 회원정보 수정
exports.updateUser = async (request, response, next) => {
    const { user_id: userId } = request.params;
    const { nickname, profileImagePath } = request.body;

    try {
        if (!userId) {
            const error = new Error(STATUS_MESSAGE.INVALID_USER_ID);
            error.status = STATUS_CODE.BAD_REQUEST;
            throw error;
        }

        if (!nickname) {
            const error = new Error(STATUS_MESSAGE.INVALID_NICKNAME);
            error.status = STATUS_CODE.BAD_REQUEST;
            throw error;
        }

        const requestData = {
            userId,
            nickname,
            profileImagePath,
        };
        const responseData = await userModel.updateUser(requestData);

        if (responseData === null) {
            const error = new Error(STATUS_MESSAGE.NOT_FOUND_USER);
            error.status = STATUS_CODE.NOT_FOUND;
            throw error;
        }

        if (responseData === STATUS_MESSAGE.UPDATE_PROFILE_IMAGE_FAILED) {
            const error = new Error(STATUS_MESSAGE.UPDATE_PROFILE_IMAGE_FAILED);
            error.status = STATUS_CODE.INTERNAL_SERVER_ERROR;
            throw error;
        }

        return response.status(STATUS_CODE.CREATED).json({
            message: STATUS_MESSAGE.UPDATE_USER_DATA_SUCCESS,
            data: null,
        });
    } catch (error) {
        return next(error);
    }
};

// 로그인 상태 체크
exports.checkAuth = async (request, response, next) => {
    const { userid: userId } = request.headers;

    try {
        if (!userId) {
		        const error = new Error(STATUS_MESSAGE.INVALID_USER_ID);
		        error.status = STATUS_CODE.BAD_REQUEST;
		        throw error;
		    }
    
        const requestData = {
            userId,
        };

        const userData = await userModel.getUser(requestData);

        if (!userData) {
            const error = new Error(STATUS_MESSAGE.NOT_FOUND_USER);
            error.status = STATUS_CODE.NOT_FOUND;
            throw error;
        }

        if (parseInt(userData.userId, 10) !== parseInt(userId, 10)) {
            const error = new Error(STATUS_MESSAGE.REQUIRED_AUTHORIZATION);
            error.status = STATUS_CODE.UNAUTHORIZED;
            throw error;
        }

        return response.status(STATUS_CODE.OK).json({
            message: null,
            data: {
                userId,
                email: userData.email,
                nickname: userData.nickname,
                profileImagePath: userData.profile_image,
                auth_token: userData.session_id,
                auth_status: true,
            },
        });
    } catch (error) {
        return next(error);
    }
};


// 비밀번호 변경
exports.changePassword = async (request, response, next) => {
    const { user_id: userId } = request.params;
    const { password } = request.body;

    try {
        if (!userId) {
            const error = new Error(STATUS_MESSAGE.INVALID_USER_ID);
            error.status = STATUS_CODE.BAD_REQUEST;
            throw error;
        }

        if (!password || !validPassword(password)) {
            const error = new Error(STATUS_MESSAGE.INVALID_PASSWORD);
            error.status = STATUS_CODE.BAD_REQUEST;
            throw error;
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        const requestData = {
            userId,
            password: hashedPassword,
        };
        const responseData = await userModel.changePassword(requestData);

        if (!responseData) {
            const error = new Error(STATUS_MESSAGE.NOT_FOUND_USER);
            error.status = STATUS_CODE.NOT_FOUND;
            throw error;
        }

        return response.status(STATUS_CODE.CREATED).json({
            message: STATUS_MESSAGE.CHANGE_USER_PASSWORD_SUCCESS,
            data: null,
        });
    } catch (error) {
        return next(error);
    }
};

// 회원 탈퇴
exports.softDeleteUser = async (request, response, next) => {
    const { user_id: userId } = request.params;

    try {
        if (!userId) {
            const error = new Error(STATUS_MESSAGE.INVALID_USER_ID);
            error.status = STATUS_CODE.BAD_REQUEST;
            throw error;
        }

        const requestData = {
            userId,
        };
        const responseData = await userModel.softDeleteUser(requestData);

        if (responseData === null) {
            const error = new Error(STATUS_MESSAGE.NOT_FOUND_USER);
            error.status = STATUS_CODE.NOT_FOUND;
            throw error;
        }

        return response.status(STATUS_CODE.OK).json({
            message: STATUS_MESSAGE.DELETE_USER_DATA_SUCCESS,
            data: null,
        });
    } catch (error) {
        return next(error);
    }
};

// 로그아웃
exports.logoutUser = async (request, response, next) => {
    const { userid: userId } = request.headers;

    try {
        request.session.destroy(async error => {
            if (error) {
                return next(error);
            }

            try {
                const requestData = {
                    userId,
                };
                await userModel.destroyUserSession(requestData, response);

                return response.status(STATUS_CODE.END).end();
            } catch (error) {
                return next(error);
            }
        });
    } catch (error) {
        return next(error);
    }
};

// 이메일 중복 체크
exports.checkEmail = async (request, response, next) => {
    const { email } = request.query;

    try {
        if (!email) {
            const error = new Error(STATUS_MESSAGE.INVALID_EMAIL);
            error.status = STATUS_CODE.BAD_REQUEST;
            throw error;
        }

        const requestData = { email };

        const resData = await userModel.checkEmail(requestData);

        if (resData === null) {
            return response.status(STATUS_CODE.OK).json({
                message: STATUS_MESSAGE.AVAILABLE_EMAIL,
                data: null,
            });
        }

        const error = new Error(STATUS_MESSAGE.ALREADY_EXIST_EMAIL);
        error.status = STATUS_CODE.BAD_REQUEST;
        throw error;
    } catch (error) {
        return next(error);
    }
};

// 닉네임 중복 체크
exports.checkNickname = async (request, response, next) => {
    const { nickname } = request.query;

    try {
        if (!nickname) {
            const error = new Error(STATUS_MESSAGE.INVALID_NICKNAME);
            error.status = STATUS_CODE.BAD_REQUEST;
            throw error;
        }

        const requestData = { nickname };

        const responseData = await userModel.checkNickname(requestData);

        if (!responseData) {
            return response.status(STATUS_CODE.OK).json({
                message: STATUS_MESSAGE.AVAILABLE_NICKNAME,
                data: null,
            });
        }

        const error = new Error(STATUS_MESSAGE.ALREADY_EXIST_NICKNAME);
        error.status = STATUS_CODE.BAD_REQUEST;
        throw error;
    } catch (error) {
        return next(error);
    }
};

exports.findUserId = async (req, res) => {
  const nickname = typeof req.body.nickname === 'string' ? req.body.nickname.trim() : null;

  if (!nickname) {
    return res.status(400).json({ message: '닉네임을 입력해주세요.' });
  }

  try {
    const user = await userModel.findByNickname({ nickname });
    console.log('[CONTROLLER] user result:', user); 

    if (!user) {
      return res.status(404).json({ message: '일치하는 닉네임이 없습니다.' });
    }

    return res.status(200).json({ email: user.email });
  } catch (err) {
    console.error('[CONTROLLER ERROR]', err);
    return res.status(500).json({ message: '서버 오류' });
  }
};


const bcrypt = require('bcrypt'); 
const generateTempPassword = () => {
  return Math.random().toString(36).slice(-10); 
};


exports.findPassword = async (req, res) => {
  const { email, nickname } = req.body;
  console.log('입력값 확인:', email, nickname);

  try {
    const sql = 'SELECT * FROM user_table WHERE email = ? AND nickname = ? LIMIT 1';
    const [rows] = await dbConnect.query(sql, [email, nickname]);

    console.log('🔍 쿼리 결과:', rows);

    if (!rows || !rows.length) {
      return res.status(404).json({ message: '일치하는 회원 정보가 없습니다.' });
    }

    const tempPassword = generateRandomPassword();
    const hashedTemp = await bcrypt.hash(tempPassword, 10);

    const updateSql = 'UPDATE user_table SET password = ? WHERE email = ?';
    await dbConnect.query(updateSql, [hashedTemp, email]);

    return res.status(200).json({
      message: '임시 비밀번호가 발급되었습니다.',
      tempPassword: tempPassword,
    });
  } catch (error) {
    console.error('findPassword error:', error);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};




