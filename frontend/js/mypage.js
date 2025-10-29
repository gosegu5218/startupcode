// 전역 변수
let isEditMode = false;
let originalUserData = {};
let currentUserData = {};

// 닉네임 유효성 검사
const validNickname = (nickname) => {
    const regex = /^[가-힣a-zA-Z0-9]{2,10}$/;
    return regex.test(nickname);
};

// 사용자 정보 로드
const loadUserInfo = async () => {
  try {
    console.log('사용자 정보 로드 시작...');
    
    const response = await fetch('http://localhost:3000/users/auth/check', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (response.ok) {
      const result = await response.json();
      const userData = result.data;
      
      // 원본 데이터 저장
      originalUserData = { ...userData };
      currentUserData = { ...userData };
      
      // UI 업데이트
      updateUI(userData);
      
    } else {
      alert('로그인이 필요합니다.');
      window.location.href = '/html/login.html';
    }
  } catch (error) {
    console.error('사용자 정보 로드 오류:', error);
    alert('네트워크 오류가 발생했습니다.');
    window.location.href = '/html/login.html';
  }
};

// UI 업데이트
const updateUI = (userData) => {
  const nicknameInput = document.getElementById('nickname');
  const emailInput = document.getElementById('email');
  const profileImg = document.getElementById('profileImg');
  
  if (nicknameInput && emailInput) {
    nicknameInput.value = userData.nickname || '';
    emailInput.value = userData.email || '';
  }
  
  if (profileImg) {
    if (userData.profileImagePath) {
      profileImg.src = `http://localhost:3000${userData.profileImagePath}`;
    } else {
      profileImg.src = '../public/image/profile/default.jpg';
    }
    profileImg.onerror = function() {
      this.src = '../public/image/profile/default.jpg';
    };
  }
};

// 편집 모드 토글
const toggleEditMode = () => {
  isEditMode = !isEditMode;
  
  const nicknameInput = document.getElementById('nickname');
  const profileUpload = document.getElementById('profileUpload');
  const editToggleBtn = document.getElementById('editToggleBtn');
  const saveBtn = document.getElementById('saveBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const deleteAccountBtn = document.getElementById('deleteAccountBtn');
  
  if (isEditMode) {
    // 편집 모드 활성화
    nicknameInput.removeAttribute('readonly');
    profileUpload.style.display = 'flex';
    editToggleBtn.style.display = 'none';
    saveBtn.style.display = 'block';
    cancelBtn.style.display = 'block';
    deleteAccountBtn.style.display = 'block';
    
    // 포커스
    nicknameInput.focus();
  } else {
    // 편집 모드 비활성화
    nicknameInput.setAttribute('readonly', true);
    profileUpload.style.display = 'none';
    editToggleBtn.style.display = 'block';
    saveBtn.style.display = 'none';
    cancelBtn.style.display = 'none';
    deleteAccountBtn.style.display = 'none';
    
    // 원본 데이터로 복원
    currentUserData = { ...originalUserData };
    updateUI(currentUserData);
    clearHelperText();
  }
};

// 닉네임 유효성 검사
const validateNickname = async (nickname) => {
  const helperElement = document.querySelector('.helperText[name="nickname"]');
  
  if (!nickname || nickname.trim() === '') {
    helperElement.textContent = '*닉네임을 입력해주세요.';
    return false;
  }
  
  if (!validNickname(nickname)) {
    helperElement.textContent = '*닉네임은 2~10자의 영문자, 한글 또는 숫자만 사용할 수 있습니다.';
    return false;
  }
  
  // 기존 닉네임과 같으면 중복 검사 생략
  if (nickname === originalUserData.nickname) {
    helperElement.textContent = '';
    return true;
  }
  
  // 중복 검사
  try {
    const response = await fetch(`http://localhost:3000/users/nickname/check?nickname=${nickname}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (response.status === 200) {
      helperElement.textContent = '';
      return true;
    } else {
      helperElement.textContent = '*중복된 닉네임입니다.';
      return false;
    }
  } catch (error) {
    helperElement.textContent = '*닉네임 확인 중 오류가 발생했습니다.';
    return false;
  }
};

// 도우미 텍스트 클리어
const clearHelperText = () => {
  const helperElement = document.querySelector('.helperText[name="nickname"]');
  if (helperElement) {
    helperElement.textContent = '';
  }
};

// 프로필 이미지 업로드
const handleProfileUpload = async (file) => {
  if (!file) return;
  
  const formData = new FormData();
  formData.append('profileImage', file);
  
  try {
    const response = await fetch('http://localhost:3000/files/users/upload/profile-image', {
      method: 'POST',
      credentials: 'include',
      body: formData
    });
    
    if (response.ok) {
      const result = await response.json();
      currentUserData.profileImagePath = result.data.filePath;
      
      // 프로필 이미지 미리보기 업데이트
      const profileImg = document.getElementById('profileImg');
      profileImg.src = `http://localhost:3000${result.data.filePath}`;
    } else {
      alert('프로필 이미지 업로드에 실패했습니다.');
    }
  } catch (error) {
    console.error('프로필 이미지 업로드 오류:', error);
    alert('프로필 이미지 업로드 중 오류가 발생했습니다.');
  }
};

// 정보 저장
const saveUserInfo = async () => {
  const nicknameInput = document.getElementById('nickname');
  const nickname = nicknameInput.value.trim();
  
  // 유효성 검사
  const isValidNickname = await validateNickname(nickname);
  if (!isValidNickname) {
    return;
  }
  
  // 변경사항 확인
  const hasChanges = 
    nickname !== originalUserData.nickname || 
    currentUserData.profileImagePath !== originalUserData.profileImagePath;
  
  if (!hasChanges) {
    alert('변경된 정보가 없습니다.');
    return;
  }
  
  try {
    const updateData = {
      nickname: nickname,
      profileImagePath: currentUserData.profileImagePath
    };
    
    const response = await fetch(`http://localhost:3000/users/${originalUserData.userId}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData)
    });
    
    if (response.ok) {
      alert('정보가 성공적으로 수정되었습니다.');
      
      // 원본 데이터 업데이트
      originalUserData.nickname = nickname;
      originalUserData.profileImagePath = currentUserData.profileImagePath;
      
      // 편집 모드 종료
      toggleEditMode();
    } else {
      const errorData = await response.json();
      alert(errorData.error?.message || '정보 수정에 실패했습니다.');
    }
  } catch (error) {
    console.error('정보 저장 오류:', error);
    alert('네트워크 오류가 발생했습니다.');
  }
};

// 회원 탈퇴
const deleteAccount = async () => {
  if (!confirm('정말로 회원 탈퇴하시겠습니까?\n작성된 게시글과 댓글은 삭제됩니다.')) {
    return;
  }
  
  try {
    const response = await fetch(`http://localhost:3000/users/${originalUserData.userId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    if (response.ok) {
      alert('회원 탈퇴가 완료되었습니다.');
      window.location.href = '/html/login.html';
    } else {
      alert('회원 탈퇴에 실패했습니다.');
    }
  } catch (error) {
    console.error('회원 탈퇴 오류:', error);
    alert('네트워크 오류가 발생했습니다.');
  }
};

// 로그아웃
const logout = async () => {
  try {
    const response = await fetch('http://localhost:3000/users/logout', {
      method: 'POST',
      credentials: 'include'
    });
    
    if (response.ok) {
      alert('로그아웃되었습니다.');
      window.location.href = '/html/login.html';
    } else {
      throw new Error('로그아웃 실패');
    }
  } catch (error) {
    console.error('로그아웃 오류:', error);
    alert('로그아웃 처리 중 오류가 발생했습니다.');
    window.location.href = '/html/login.html';
  }
};

// 이벤트 리스너 등록
const setupEventListeners = () => {
  // 편집 토글 버튼
  const editToggleBtn = document.getElementById('editToggleBtn');
  editToggleBtn?.addEventListener('click', toggleEditMode);
  
  // 저장 버튼
  const saveBtn = document.getElementById('saveBtn');
  saveBtn?.addEventListener('click', saveUserInfo);
  
  // 취소 버튼
  const cancelBtn = document.getElementById('cancelBtn');
  cancelBtn?.addEventListener('click', toggleEditMode);
  
  // 비밀번호 변경 버튼
  const modifyPasswordBtn = document.getElementById('modifyPassword');
  modifyPasswordBtn?.addEventListener('click', () => {
    window.location.href = '/html/modifyPassword.html';
  });
  
  // 로그아웃 버튼
  const logoutBtn = document.getElementById('logoutBtn');
  logoutBtn?.addEventListener('click', () => {
    if (confirm('로그아웃하시겠습니까?')) {
      logout();
    }
  });
  
  // 회원 탈퇴 버튼
  const deleteAccountBtn = document.getElementById('deleteAccountBtn');
  deleteAccountBtn?.addEventListener('click', deleteAccount);
  
  // 닉네임 입력 이벤트
  const nicknameInput = document.getElementById('nickname');
  nicknameInput?.addEventListener('input', async (event) => {
    if (isEditMode) {
      currentUserData.nickname = event.target.value;
      // 디바운싱을 위해 타이머 사용
      clearTimeout(window.nicknameTimer);
      window.nicknameTimer = setTimeout(() => {
        validateNickname(event.target.value);
      }, 500);
    }
  });
  
  // 프로필 이미지 업로드
  const profileInput = document.getElementById('profileInput');
  profileInput?.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
      handleProfileUpload(file);
    }
  });
};

// 초기화
document.addEventListener('DOMContentLoaded', () => {
  console.log('마이페이지 로드됨');
  loadUserInfo();
  setupEventListeners();
});
