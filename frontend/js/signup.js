import Dialog from '../component/dialog/dialog.js';
import Header from '../component/header/header.js';
import {
    prependChild,
    validEmail,
    validPassword,
    validNickname,
} from '../utils/function.js';
import {
    userSignup,
    checkEmail,
    checkNickname,
    fileUpload,
} from '../api/signupRequest.js';

const MAX_PASSWORD_LENGTH = 20;
const HTTP_OK = 200;
const HTTP_CREATED = 201;

const signupData = {
    email: '',
    password: '',
    nickname: '',
    profileImagePath: undefined,
};

const getSignupData = () => {
    const signupBtn = document.querySelector('#signupBtn');
    const { email, password, passwordCheck, nickname } = signupData;
    
    if (!email || !password || !passwordCheck || !nickname) {
        Dialog('필수 입력 사항', '모든 값을 입력해주세요.');
        return false;
    }

    // 버튼 로딩 상태 설정
    signupBtn.textContent = '가입 중...';
    signupBtn.disabled = true;

    sendSignupData();
};

const sendSignupData = async () => {
    const signupBtn = document.querySelector('#signupBtn');
    const { passwordCheck, ...props } = signupData;
    
    try {
        if (localStorage.getItem('profilePath')) {
            props.profileImagePath = localStorage.getItem('profilePath');
        }

        if (props.password > MAX_PASSWORD_LENGTH) {
            Dialog('비밀번호', '비밀번호는 20자 이하로 입력해주세요.');
            resetSignupButton();
            return;
        }
        
        // signupData를 서버로 전송
        const response = await userSignup(props);

        // 응답이 성공적으로 왔을 경우
        if (response.status === HTTP_CREATED) {
            localStorage.removeItem('profilePath');

            alert('회원가입이 완료되었습니다.\n 환영합니다 !');

            location.href = '/html/login.html';
        } else {
            Dialog('회원 가입 실패', '잠시 뒤 다시 시도해 주세요', () => {});
            localStorage.removeItem('profilePath');
            resetSignupButton();
            setTimeout(() => {
                location.href = '/html/signup.html';
            }, 1500);
        }
    } catch (error) {
        console.error('회원가입 에러:', error);
        Dialog('회원 가입 실패', '네트워크 오류가 발생했습니다. 다시 시도해 주세요.', () => {});
        resetSignupButton();
    }
};

// 회원가입 버튼 상태 초기화 함수
const resetSignupButton = () => {
    const signupBtn = document.querySelector('#signupBtn');
    if (signupBtn) {
        signupBtn.textContent = '회원가입';
        signupBtn.disabled = false;
    }
};

const signupClick = () => {
    // signup 버튼 클릭 시
    const signupBtn = document.querySelector('#signupBtn');
    signupBtn.addEventListener('click', getSignupData);
};

const changeEventHandler = async (event, uid) => {
    if (uid == 'profile') {
        const file = event.target.files[0];
        if (!file) return;

        const helperElement = document.querySelector(
            `.inputBox p[name="${uid}"]`,
        );
        helperElement.textContent = '';
    }
    observeSignupData();
};

const inputEventHandler = async (event, uid) => {
    if (uid == 'email') {
        const value = event.target.value;
        const isValidEmail = validEmail(value);
        const helperElement = document.querySelector(
            `.inputBox p[name="${uid}"]`,
        );
        let isComplete = false;

        if (!helperElement) return;

        if (value == '' || value == null) {
            helperElement.textContent = '*이메일을 입력해주세요.';
        } else if (!isValidEmail) {
            helperElement.textContent =
                '*올바른 이메일 주소 형식을 입력해주세요. (예: example@example.com)';
        } else {
            const response = await checkEmail(value);
            if (response.status === HTTP_OK) {
                helperElement.textContent = '';
                isComplete = true;
            } else {
                helperElement.textContent = '*중복된 이메일 입니다.';
            }
        }
        if (isComplete) {
            signupData.email = value;
        } else {
            signupData.email = '';
        }
    } else if (uid == 'pw') {
        const value = event.target.value;
        const isValidPassword = validPassword(value);
        const helperElement = document.querySelector(
            `.inputBox p[name="${uid}"]`,
        );
        const helperElementCheck = document.querySelector(
            `.inputBox p[name="pwck"]`,
        );

        if (!helperElement) return;

        if (value == '' || value == null) {
            helperElement.textContent = '*비밀번호를 입력해주세요.';
            helperElementCheck.textContent = '';
        } else if (!isValidPassword) {
            helperElement.textContent =
                '*비밀번호는 8자 이상, 20자 이하이며, 대문자, 소문자, 숫자, 특수문자를 각각 최소 1개 포함해야 합니다.';
            helperElementCheck.textContent = '';
        } else {
            helperElement.textContent = '';
            signupData.password = value;
        }
    } else if (uid == 'pwck') {
        const value = event.target.value;
        const helperElement = document.querySelector(
            `.inputBox p[name="${uid}"]`,
        );
        // pw 입력란의 현재 값
        const password = signupData.password;

        if (value == '' || value == null) {
            helperElement.textContent = '*비밀번호 한번 더 입력해주세요.';
        } else if (password !== value) {
            helperElement.textContent = '*비밀번호가 다릅니다.';
        } else {
            signupData.passwordCheck = value;
            helperElement.textContent = '';
        }
    } else if (uid == 'nickname') {
        const value = event.target.value;
        const isValidNickname = validNickname(value);
        const helperElement = document.querySelector(
            `.inputBox p[name="${uid}"]`,
        );
        let isComplete = false;

        if (value == '' || value == null) {
            helperElement.textContent = '*닉네임을 입력해주세요.';
        } else if (value.includes(' ')) {
            helperElement.textContent = '*뛰어쓰기를 없애주세요.';
        } else if (value.length > 10) {
            helperElement.textContent =
                '*닉네임은 최대 10자까지 작성 가능합니다.';
        } else if (!isValidNickname) {
            helperElement.textContent =
                '*닉네임에 특수 문자는 사용할 수 없습니다.';
        } else {
            const response = await checkNickname(value);

            if (response.status === HTTP_OK) {
                helperElement.textContent = '';
                isComplete = true;
            } else {
                helperElement.textContent = '*중복된 닉네임 입니다.';
            }
        }

        if (isComplete) {
            signupData.nickname = value;
        } else {
            signupData.nickname = '';
        }
    }
    observeSignupData();
};

const addEventForInputElements = () => {
    const InputElement = document.querySelectorAll('input');
    InputElement.forEach(element => {
        const id = element.id;
        if (id === 'profile') {
            element.addEventListener('change', event =>
                changeEventHandler(event, id),
            );
        } else {
            element.addEventListener('input', event =>
                inputEventHandler(event, id),
            );
        }
    });
};

const observeSignupData = () => {
    const { email, password, passwordCheck, nickname } = signupData;
    const button = document.querySelector('#signupBtn');

    if (
        !email ||
        !validEmail(email) ||
        !password ||
        !validPassword(password) ||
        !nickname ||
        !validNickname(nickname) ||
        !passwordCheck
    ) {
        button.disabled = true;
        button.style.backgroundColor = '#ACA0EB';
    } else {
        button.disabled = false;
        button.style.backgroundColor = '#7F6AEE';
    }
};

const uploadProfileImage = () => {
    document
        .getElementById('profile')
        .addEventListener('change', async event => {
            const file = event.target.files[0];
            if (!file) {
                console.log('파일이 선택되지 않았습니다.');
                return;
            }

            const formData = new FormData();
            formData.append('profileImage', file);

            // 파일 업로드를 위한 POST 요청 실행
            try {
                const response = await fileUpload(formData);
                if (!response.ok) throw new Error('서버 응답 오류');

                const responseData = await response.json();
                localStorage.setItem('profilePath', responseData.data.filePath);
            } catch (error) {
                console.error('업로드 중 오류 발생:', error);
            }
        });
};

const init = async () => {
    // 회원가입 페이지에서는 헤더 제거
    // prependChild(document.body, Header('커뮤니티', 1));
    observeSignupData();
    addEventForInputElements();
    signupClick();
    uploadProfileImage();
    
    // 회원가입 버튼 스타일 강제 설정
    const signupButton = document.querySelector('#signupBtn');
    if (signupButton) {
        signupButton.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
        signupButton.style.color = '#ffffff';
        signupButton.style.border = '1px solid #3b82f6';
        signupButton.style.fontWeight = '600';
        signupButton.style.boxShadow = '0 4px 16px rgba(59, 130, 246, 0.3)';
    }
    
    // 파일 업로드 버튼 스타일 설정
    const fileLabel = document.querySelector('label[for="profileImage"]');
    if (fileLabel) {
        fileLabel.style.color = '#000000';
        fileLabel.style.border = '1px solid #000000';
        fileLabel.style.backgroundColor = '#ffffff';
        fileLabel.style.fontWeight = '600';
    }
    
    // 입력 필드 포커스 효과
    const inputs = document.querySelectorAll('input[type="text"], input[type="password"], input[type="email"]');
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            input.style.borderColor = '#000000';
            input.style.outline = 'none';
        });
        
        input.addEventListener('blur', () => {
            if (!input.value.trim()) {
                input.style.borderColor = '#ddd';
            }
        });
    });
};

init();