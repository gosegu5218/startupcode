const findPwBtn = document.getElementById('findPwBtn');
const emailInput = document.getElementById('email');
const nicknameInput = document.getElementById('nickname');

findPwBtn.addEventListener('click', async (e) => {
  e.preventDefault();

  const email = emailInput.value.trim();
  const nickname = nicknameInput.value.trim();

  if (!email || !nickname) {
    alert('이메일과 닉네임을 모두 입력해주세요.');
    return;
  }

  try {
    const res = await fetch('http://localhost:3000/users/find-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json'},
      credentials: 'include', 
      body: JSON.stringify({ email, nickname }),
    });

    const result = await res.json();

    if (res.ok && result.tempPassword) {
      alert(`✅ 임시 비밀번호: ${result.tempPassword}\n로그인 후 반드시 비밀번호를 변경해주세요.`);
    } else {
      // 서버에서 명시적인 에러 메시지를 보내는 경우
      const errorMessage = result?.error?.message || result?.message || '일치하는 정보가 없습니다.';
      alert(`⚠️ ${errorMessage}`);
    }
  } catch (err) {
    console.error('❌ 요청 실패:', err);
    alert('서버 오류가 발생했습니다. 네트워크 상태 또는 서버를 확인해주세요.');
  }
});
