const bcrypt = require('bcrypt');
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
    
        console.log('=== 로그인 디버깅 ===');
        console.log('로그인 시도:', email);
        console.log('현재 Session ID:', request.sessionID);
        
        const requestData = {
            email,
            password,
            sessionId: request.sessionID,
        };
        const responseData = await userModel.loginUser(requestData, response);

        console.log('로그인 응답 데이터:', responseData);

        if (!responseData || responseData === null) {
            const error = new Error(STATUS_MESSAGE.INVALID_EMAIL_OR_PASSWORD);
            error.status = STATUS_CODE.UNAUTHORIZED;
            throw error;
        }
        
        // 세션에 사용자 정보 저장
        request.session.userId = responseData.userId;
        request.session.email = responseData.email;
        request.session.isLoggedIn = true;
        
        console.log('로그인 성공:', responseData.email);
        console.log('세션 저장 후 Session ID:', request.sessionID);
        
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
    try {
        console.log('=== checkAuth 디버깅 ===');
        console.log('Session ID:', request.sessionID);
        console.log('Session 내용:', request.session);
        
        // 세션에서 로그인 상태 확인
        if (!request.session.isLoggedIn || !request.session.userId) {
            console.log('세션에 로그인 정보가 없습니다.');
            const error = new Error(STATUS_MESSAGE.REQUIRED_AUTHORIZATION);
            error.status = STATUS_CODE.UNAUTHORIZED;
            throw error;
        }

        const userId = request.session.userId;
        
        // 사용자 정보 조회
        const sql = `SELECT user_id, email, nickname, file_id FROM user_table WHERE user_id = ? AND deleted_at IS NULL;`;
        const userResults = await dbConnect.query(sql, [userId]);

        console.log('DB 조회 결과:', userResults);

        if (!userResults || userResults.length === 0) {
            console.log('사용자를 찾을 수 없습니다.');
            const error = new Error(STATUS_MESSAGE.NOT_FOUND_USER);
            error.status = STATUS_CODE.UNAUTHORIZED;
            throw error;
        }

        const user = userResults[0];
        let profileImagePath = null;

        // 프로필 이미지가 있다면 가져오기
        if (user.file_id) {
            const imageSql = `SELECT file_path FROM file_table WHERE file_id = ? AND deleted_at IS NULL;`;
            const imageResults = await dbConnect.query(imageSql, [user.file_id]);
            if (imageResults && imageResults.length > 0) {
                profileImagePath = imageResults[0].file_path;
            }
        }

        console.log('인증 성공:', user.email);

        return response.status(STATUS_CODE.OK).json({
            message: STATUS_MESSAGE.AUTH_CHECK_SUCCESS || 'Authentication successful',
            data: {
                userId: user.user_id,
                email: user.email,
                nickname: user.nickname,
                profileImagePath: profileImagePath,
                auth_status: true,
            },
        });
    } catch (error) {
        console.log('checkAuth 오류:', error.message);
        return next(error);
    }
};


// 비밀번호 변경
exports.changePassword = async (request, response, next) => {
    const { user_id: userId } = request.params;
    const { password, oldPassword } = request.body;

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

        // 현재 사용자의 비밀번호 정보 가져오기 (비밀번호 비교를 위해)
        const dbConnect = require('../database/index.js');
        const getUserSql = `SELECT password FROM user_table WHERE user_id = ? AND deleted_at IS NULL;`;
        const userResults = await dbConnect.query(getUserSql, [userId]);
        
        if (!userResults || userResults.length === 0) {
            const error = new Error(STATUS_MESSAGE.NOT_FOUND_USER);
            error.status = STATUS_CODE.NOT_FOUND;
            throw error;
        }

        // 새 비밀번호가 기존 비밀번호와 같은지 확인
        if (await bcrypt.compare(password, userResults[0].password)) {
            const error = new Error('기존 비밀번호와 동일합니다. 새로운 비밀번호를 입력해주세요.');
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
    try {
        console.log('=== 로그아웃 디버깅 ===');
        console.log('Session ID:', request.sessionID);
        console.log('Session 내용:', request.session);
        
        const userId = request.session.userId;
        
        // 세션 삭제
        request.session.destroy(async error => {
            if (error) {
                console.log('세션 삭제 오류:', error);
                return next(error);
            }

            try {
                if (userId) {
                    const requestData = {
                        userId,
                    };
                    await userModel.destroyUserSession(requestData);
                }

                console.log('로그아웃 성공');
                return response.status(STATUS_CODE.OK).json({
                    message: '로그아웃되었습니다.',
                    data: null
                });
            } catch (error) {
                console.log('DB 세션 삭제 오류:', error);
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

const generateTempPassword = () => {
  return Math.random().toString(36).slice(-10); 
};




