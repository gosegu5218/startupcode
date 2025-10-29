import Header from '../component/header/header.js';
import {
    authCheckReverse,
    prependChild,
    setCookie,
    validEmail,
} from '../utils/function.js';
import { userLogin } from '../api/loginRequest.js';

const HTTP_OK = 200;
const MAX_PASSWORD_LENGTH = 8;

const loginData = {
    id: '',
    password: '',
};

const updateHelperText = (helperTextElement, message = '') => {
    if (helperTextElement) {
        helperTextElement.textContent = message;
    }
};

const updateEmailHelperText = (message = '') => {
    const emailHelperElement = document.querySelector('#emailHelperText');
    updateHelperText(emailHelperElement, message);
};

const updatePasswordHelperText = (message = '') => {
    const passwordHelperElement = document.querySelector('#passwordHelperText');
    updateHelperText(passwordHelperElement, message);
};

const loginClick = async () => {
    const { id: email, password } = loginData;

    // 에러 메시지 초기화
    updateEmailHelperText('');
    updatePasswordHelperText('');

    // 이메일 입력 확인
    if (!email || email.trim() === '') {
        updateEmailHelperText('*아이디를 입력해주세요.');
        return;
    }

    const response = await userLogin(email, password);

    console.log('status:', response.status);

    if (!response.ok) {
        updatePasswordHelperText('*입력하신 계정 정보가 정확하지 않습니다.');
        return;
    }

    const result = await response.json();
    if (response.status !== HTTP_OK) {
        updatePasswordHelperText('*입력하신 계정 정보가 정확하지 않습니다.');
        return;
    }

    setCookie('session', result.data.sessionId, 14);
    setCookie('userId', result.data.userId, 14);
    // 로그인 후 메인 페이지로 이동 (요청에 따라 main-page.html로 변경)
    location.href = '/html/main-page.html';
};

const observeSignupData = () => {
    const { id: email, password } = loginData;
    const button = document.querySelector('#login');

    const isValidEmail = validEmail(email);
    
    // 이메일 유효성 검사 메시지는 이메일 필드에 표시
    updateEmailHelperText(
        isValidEmail || !email
            ? ''
            : '*올바른 이메일 주소 형식을 입력해주세요. (예: example@example.com)'
    );

    // 비밀번호 길이 검사 메시지는 비밀번호 필드에 표시
    updatePasswordHelperText(
        password && password.length < MAX_PASSWORD_LENGTH && password.length > 0
            ? '*비밀번호는 8자 이상이어야 합니다.'
            : ''
    );

    button.disabled = !(
        email &&
        isValidEmail &&
        password &&
        password.length >= MAX_PASSWORD_LENGTH
    );
    
    // 버튼 색상은 새로운 스타일에 맞게 조정
    if (button.disabled) {
        button.style.background = '#000000';
        button.style.color = '#ffffff';
        button.style.border = '1px solid #000000';
        button.style.cursor = 'not-allowed';
    } else {
        button.style.background = '#000000';
        button.style.color = '#ffffff';
        button.style.border = '1px solid #000000';
        button.style.cursor = 'pointer';
    }
};

const eventSet = () => {
    // 로그인 버튼 클릭 이벤트
    document.getElementById('login').addEventListener('click', (event) => {
        event.preventDefault();
        loginClick();
    });

    // 폼 제출 이벤트 방지 - 로그인 버튼에서만
    document.querySelector('.login-form').addEventListener('submit', (event) => {
        // 링크 클릭이 아닌 경우에만 preventDefault
        if (event.submitter && event.submitter.id === 'login') {
            event.preventDefault();
            loginClick();
        } else if (!event.submitter) {
            event.preventDefault();
            loginClick();
        }
    });

    // 엔터키 이벤트 - 입력 필드에서만 동작
    ['id', 'pw'].forEach(field => {
        const inputElement = document.getElementById(field);
        inputElement.addEventListener('keypress', event => {
            if (event.key === 'Enter') {
                event.preventDefault();
                loginClick();
            }
        });
    });

    ['id', 'pw'].forEach(field => {
        const inputElement = document.getElementById(field);
        inputElement.addEventListener('input', event =>
            onChangeHandler(event, field === 'id' ? 'id' : 'password'),
        );

        if (field === 'id') {
            inputElement.addEventListener('focusout', event =>
                lottieAnimation(validEmail(event.target.value) ? 1 : 2),
            );
        }
    });

    document
        .getElementById('id')
        .addEventListener('input', event => validateEmail(event.target));
};

const onChangeHandler = (event, uid) => {
    loginData[uid] = event.target.value;
    observeSignupData();
};

const validateEmail = input => {
    const regex = /^[A-Za-z0-9@.]+$/;
    if (!regex.test(input.value)) input.value = input.value.slice(0, -1);
};

let lottieInstance = null;
const lottieAnimation = type => {
    const container = document.getElementById('lottie-animation');
    const animationPaths = [
        '/public/check_anim.json',
        '/public/denied_anim.json',
    ];
    if (lottieInstance) lottieInstance.destroy();
    container.innerHTML = '';
    lottieInstance = window.lottie.loadAnimation({
        container,
        renderer: 'svg',
        loop: false,
        autoplay: true,
        path: animationPaths[type - 1],
    });
};

const init = async () => {
    observeSignupData();
    // 헤더 제거 - 대신 대표 아이콘 사용
    // prependChild(document.body, Header('커뮤니티', 0));
    eventSet();
    
    // 로그인 버튼 스타일 강제 설정
    const loginButton = document.querySelector('#login');
    if (loginButton) {
        loginButton.style.color = '#000000';
        loginButton.style.border = '1px solid #000000';
        loginButton.style.fontWeight = '600';
    }
    
    // 링크들이 정상 작동하도록 명시적 처리
    const findLinks = document.querySelectorAll('.findLink');
    findLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.stopPropagation();
            const href = link.getAttribute('href');
            if (href) {
                window.location.href = href;
            }
        });
    });
    
    localStorage.clear();
    document.cookie = '';
};

init();
