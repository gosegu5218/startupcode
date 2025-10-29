// 간단한 비밀번호 유효성 검사 함수
const validPassword = (password) => {
    // 8자 이상, 20자 이하, 대문자, 소문자, 숫자, 특수문자 각각 최소 1개
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;
    return regex.test(password);
};

const button = document.querySelector('#modifyBtn');

const HTTP_CREATED = 201;

const modifyData = {
    email: '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
};

const observeData = () => {
    const { email, oldPassword, newPassword, confirmPassword } = modifyData;

    // 모든 필드가 입력되고 새 비밀번호와 확인이 일치하는지 확인
    if (!email || !oldPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword) {
        button.disabled = true;
    } else {
        button.disabled = false;
    }
};

const blurEventHandler = async (event, uid) => {
    const value = event.target.value;
    const helperElement = document.querySelector(`.inputBox p[name="${uid}"]`);

    if (!helperElement) return;

    if (uid === 'email') {
        const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        if (value === '' || value === null) {
            helperElement.textContent = '*이메일을 입력해주세요.';
        } else if (!isValidEmail) {
            helperElement.textContent = '*올바른 이메일 형식이 아닙니다.';
        } else {
            helperElement.textContent = '';
            modifyData.email = value;
        }
    } else if (uid === 'oldPassword') {
        if (value === '' || value === null) {
            helperElement.textContent = '*기존 비밀번호를 입력해주세요.';
        } else {
            helperElement.textContent = '';
            modifyData.oldPassword = value;
        }
    } else if (uid === 'newPassword') {
        const isValidPassword = validPassword(value);
        if (value === '' || value === null) {
            helperElement.textContent = '*새 비밀번호를 입력해주세요.';
        } else if (!isValidPassword) {
            helperElement.textContent = '*비밀번호는 8자 이상, 20자 이하이며, 대문자, 소문자, 숫자, 특수문자를 각각 최소 1개 포함해야 합니다.';
        } else {
            helperElement.textContent = '';
            modifyData.newPassword = value;
        }
        
        // 새 비밀번호가 변경되면 확인 필드도 다시 검증
        const confirmPasswordInput = document.getElementById('confirmPassword');
        if (confirmPasswordInput.value) {
            const confirmHelperElement = document.querySelector('.inputBox p[name="confirmPassword"]');
            if (confirmPasswordInput.value !== value) {
                confirmHelperElement.textContent = '*비밀번호가 일치하지 않습니다. 다시 확인해주세요.';
                confirmHelperElement.className = 'helperText error';
                modifyData.confirmPassword = '';
            } else if (confirmPasswordInput.value === value && value !== '') {
                confirmHelperElement.textContent = '✓ 비밀번호가 일치합니다.';
                confirmHelperElement.className = 'helperText success';
                modifyData.confirmPassword = confirmPasswordInput.value;
            }
        }
    } else if (uid === 'confirmPassword') {
        const newPasswordInput = document.getElementById('newPassword');
        const newPassword = newPasswordInput.value;
        
        if (value === '' || value === null) {
            helperElement.textContent = '*비밀번호 확인을 입력해주세요.';
        } else if (!newPassword) {
            helperElement.textContent = '*먼저 새 비밀번호를 입력해주세요.';
            helperElement.className = 'helperText error';
        } else if (newPassword !== value) {
            helperElement.textContent = '*비밀번호가 일치하지 않습니다. 다시 확인해주세요.';
            helperElement.className = 'helperText error';
        } else {
            helperElement.textContent = '✓ 비밀번호가 일치합니다.';
            helperElement.className = 'helperText success';
            modifyData.confirmPassword = value;
        }
    }

    observeData();
};

const addEventForInputElements = () => {
    const InputElement = document.querySelectorAll('input');
    InputElement.forEach(element => {
        const id = element.id;

        element.addEventListener('input', event => blurEventHandler(event, id));
    });
};

const modifyPassword = async () => {
    const { email, oldPassword, newPassword } = modifyData;

    // 입력 검증
    if (!email || !oldPassword || !newPassword) {
        alert('모든 필드를 입력해주세요.');
        return;
    }

    try {
        // 1단계: 먼저 로그인으로 사용자 인증
        const loginResponse = await fetch('http://localhost:3000/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: oldPassword
            })
        });

        const loginResult = await loginResponse.json();

        if (!loginResponse.ok) {
            alert('이메일 또는 기존 비밀번호가 올바르지 않습니다.');
            return;
        }

        // 2단계: 로그인 성공 후 비밀번호 변경
        const userId = loginResult.data.userId;
        const changeResponse = await fetch(`http://localhost:3000/users/${userId}/password`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                password: newPassword,
                oldPassword: oldPassword
            })
        });

        if (changeResponse.ok) {
            alert('비밀번호가 성공적으로 변경되었습니다.');
            location.href = '/html/login.html';
        } else {
            const changeResult = await changeResponse.json();
            alert(changeResult.message || '기존 비밀번호와 동일합니다. 새로운 비밀번호를 입력해주세요.');
            
            // 비밀번호 필드들 초기화
            const newPasswordInput = document.getElementById('newPassword');
            const confirmPasswordInput = document.getElementById('confirmPassword');
            
            if (newPasswordInput) {
                newPasswordInput.value = '';
            }
            if (confirmPasswordInput) {
                confirmPasswordInput.value = '';
            }
            
            // modifyData도 초기화
            modifyData.newPassword = '';
            modifyData.confirmPassword = '';
            
            // 헬퍼 텍스트도 초기화
            const newPasswordHelper = document.querySelector('.inputBox p[name="newPassword"]');
            const confirmPasswordHelper = document.querySelector('.inputBox p[name="confirmPassword"]');
            
            if (newPasswordHelper) {
                newPasswordHelper.textContent = '';
                newPasswordHelper.className = 'helperText';
            }
            if (confirmPasswordHelper) {
                confirmPasswordHelper.textContent = '';
                confirmPasswordHelper.className = 'helperText';
            }
            
            // 버튼 상태 업데이트
            observeData();
            
            // 새 비밀번호 입력란에 포커스
            if (newPasswordInput) {
                newPasswordInput.focus();
            }
        }
    } catch (error) {
        console.error('비밀번호 변경 오류:', error);
        alert('네트워크 오류가 발생했습니다. 다시 시도해주세요.');
    }
};

const init = () => {
    console.log('비밀번호 수정 페이지 로드됨');
    
    if (!button) {
        console.error('modifyBtn 버튼을 찾을 수 없습니다');
        return;
    }
    
    // 버튼 스타일 강제 적용
    button.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
    button.style.color = '#ffffff';
    button.style.border = '1px solid #3b82f6';
    button.style.boxShadow = '0 4px 16px rgba(59, 130, 246, 0.3)';
    button.style.fontWeight = '600';
    
    button.addEventListener('click', modifyPassword);
    addEventForInputElements();
    observeData();
    
    console.log('이벤트 리스너 등록 완료');
};

try {
    init();
} catch (error) {
    console.error('페이지 초기화 오류:', error);
}