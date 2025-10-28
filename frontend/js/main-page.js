// LOGIN/LOGOUT 기능
const authBtn = document.getElementById('authBtn');

// 쿠키 추출 함수
const getMainPageCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

const setupAuthBtn = () => {
  if (!authBtn) return;
  
  const session = getMainPageCookie('session');
  
  if (session) {
    // 로그인 상태 - LOGOUT
    authBtn.textContent = 'LOGOUT';
    authBtn.href = '/html/login.html';
    authBtn.onclick = (e) => {
      e.preventDefault();
      document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'userId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      window.location.href = '/html/login.html';
    };
  } else {
    // 미로그인 상태 - LOGIN
    authBtn.textContent = 'LOGIN';
    authBtn.href = '/html/login.html';
    authBtn.onclick = null;
  }
};

setupAuthBtn();

// 배경 영상 자동 재생 로직
const videoElement = document.getElementById('backgroundVideo');
const videoSources = [
  '/video/바탕화면1.mp4',
  '/video/바탕화면2.mp4',
  '/video/바탕화면3.mp4'
];
let currentVideoIndex = 0;

if (videoElement) {
  // 첫 번째 영상 로드
  const loadVideo = (index) => {
    const source = document.createElement('source');
    source.src = videoSources[index];
    source.type = 'video/mp4';
    videoElement.innerHTML = '';
    videoElement.appendChild(source);
    videoElement.load();
  };

  // 초기 영상 로드
  loadVideo(0);

  // 현재 영상 재생 종료 시 다음 영상으로 전환
  videoElement.addEventListener('ended', () => {
    currentVideoIndex = (currentVideoIndex + 1) % videoSources.length;
    loadVideo(currentVideoIndex);
    videoElement.play().catch(err => {
      console.log('다음 영상 재생 실패:', err);
    });
  });

  // 초기 재생 시도
  setTimeout(() => {
    videoElement.play().catch(err => {
      console.log('자동 재생 실패:', err);
    });
  }, 500);
}
