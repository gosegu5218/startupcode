// 사용자 정보 로드
const loadUserInfo = () => {
  const nicknameInput = document.getElementById('nickname');
  const emailInput = document.getElementById('email');
  
  if (nicknameInput && emailInput) {
    nicknameInput.value = '사용자 닉네임';
    emailInput.value = 'user@example.com';
  }
};

// 회원정보 수정 버튼
const modifyInfoBtn = document.getElementById('modifyInfo');
if (modifyInfoBtn) {
  modifyInfoBtn.addEventListener('click', () => {
    window.location.href = '/html/modifyInfo.html';
  });
}

// 비밀번호 변경 버튼
const modifyPasswordBtn = document.getElementById('modifyPassword');
if (modifyPasswordBtn) {
  modifyPasswordBtn.addEventListener('click', () => {
    window.location.href = '/html/modifyPassword.html';
  });
}

// 페이지 로드 시 사용자 정보 로드
loadUserInfo();
