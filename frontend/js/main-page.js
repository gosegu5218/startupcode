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
