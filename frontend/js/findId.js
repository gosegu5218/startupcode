const findIdBtn = document.getElementById('findIdBtn');
const nicknameInput = document.getElementById('nickname');
const resultBox = document.getElementById('resultBox'); // 이건 이제 안 써도 됨
const foundEmail = document.getElementById('foundEmail'); // 이 부분도 사용 X

findIdBtn.addEventListener('click', async (e) => {
  e.preventDefault();

  const nickname = nicknameInput.value.trim();
  if (!nickname) {
    alert('닉네임을 입력해주세요.');
    return;
  }

  try {
    const res = await fetch('http://localhost:3000/users/find-id', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname }),
    });

    const result = await res.json();

    if (res.ok && result.email) {
      alert(`가입된 이메일은 ${result.email} 입니다.`);
    } else {
      alert(result.message || '일치하는 닉네임이 없습니다.');
    }
  } catch (err) {
    console.error('서버 오류:', err);
    alert('서버 오류가 발생했습니다.');
  }
});
