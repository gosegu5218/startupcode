import { serverSessionCheck, getCookie } from '../utils/function.js';

// 페이지 로드 시 로그인 상태 확인 (선택적)
const checkLoginStatus = async () => {
    try {
        console.log('로그인 상태 확인 중...');
        const response = await serverSessionCheck();
        console.log('서버 응답:', response.status);
        
        if (response && response.ok) {
            console.log('로그인된 상태');
            // 로그인된 상태 - 로그아웃 버튼 표시
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.textContent = 'LOGOUT';
                logoutBtn.href = '#';
                logoutBtn.onclick = (e) => {
                    e.preventDefault();
                    if (confirm('로그아웃하시겠습니까?')) {
                        // 로그아웃 처리
                        fetch('http://localhost:3000/users/logout', {
                            method: 'POST',
                            credentials: 'include'
                        }).then(() => {
                            window.location.href = '/html/login.html';
                        }).catch((error) => {
                            console.error('로그아웃 오류:', error);
                            window.location.href = '/html/login.html';
                        });
                    }
                };
            }
        } else {
            console.log('로그인되지 않은 상태 또는 세션 만료');
            // 로그인되지 않은 상태 - 로그인 버튼 표시
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.textContent = 'LOGIN';
                logoutBtn.href = '/html/login.html';
                logoutBtn.onclick = null; // 이벤트 핸들러 제거
            }
        }
    } catch (error) {
        console.log('로그인 상태 확인 실패:', error);
        // 로그인되지 않은 상태로 처리
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.textContent = 'LOGIN';
            logoutBtn.href = '/html/login.html';
            logoutBtn.onclick = null; // 이벤트 핸들러 제거
        }
    }
};

// 페이지 로드 시 로그인 상태 확인 (필수가 아님)
checkLoginStatus();
