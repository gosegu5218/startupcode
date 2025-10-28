import { getServerUrl, getCookie, authCheck } from '../utils/function.js';
import { getPost, deletePost, writeComment, getComments, toggleLike, checkUserLike } from '../api/boardRequest.js';

const DEFAULT_PROFILE_IMAGE = '../public/image/profile/default.jpg';
const MAX_COMMENT_LENGTH = 1000;
const HTTP_OK = 200;

// URL 쿼리 파라미터 가져오기
const getQueryString = (name) => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
};

// 날짜 포매팅
const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}년 ${month}월 ${day}일 ${hours}:${minutes}`;
};

// 게시글 상세 정보 가져오기
const getBoardDetail = async (postId) => {
    try {
        const response = await getPost(postId);
        if (!response.ok) throw new Error('게시글 정보를 가져오는데 실패하였습니다.');
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error(error);
        return null;
    }
};

// 게시글 정보 표시
const setBoardDetail = (data) => {
    // 제목
    const titleElement = document.querySelector('#postTitle');
    if (titleElement) titleElement.textContent = data.post_title;

    // 작성자 정보
    const authorNameElement = document.querySelector('#authorName');
    if (authorNameElement) authorNameElement.textContent = data.nickname || '작성자';

    const authorAvatarElement = document.querySelector('#authorAvatar');
    if (authorAvatarElement) {
        authorAvatarElement.src =
            data.profileImage && data.profileImage !== 'null'
                ? `${getServerUrl()}${data.profileImage}`
                : DEFAULT_PROFILE_IMAGE;
    }

    // 작성 날짜
    const postDateElement = document.querySelector('#postDate');
    if (postDateElement) {
        postDateElement.textContent = formatDate(data.created_at);
    }

    // 게시글 내용
    const contentElement = document.querySelector('#contentText');
    if (contentElement) {
        contentElement.textContent = data.post_content;
    }

    // 게시글 이미지
    const contentImageElement = document.querySelector('#contentImage');
    if (contentImageElement && data.filePath) {
        const img = document.createElement('img');
        img.src = `${getServerUrl()}${data.filePath}`;
        img.style.maxWidth = '100%';
        img.style.borderRadius = '8px';
        contentImageElement.innerHTML = '';
        contentImageElement.appendChild(img);
    }

    // 좋아요 수
    const likeCountElement = document.querySelector('#likeCount');
    if (likeCountElement) {
        likeCountElement.textContent = data.like || 0;
    }

    // 조회수
    const viewCountElement = document.querySelector('#viewCount');
    if (viewCountElement) {
        viewCountElement.textContent = data.hits || 0;
    }

    // 댓글 수
    const commentCountElement = document.querySelector('#commentCountDisplay');
    if (commentCountElement) {
        commentCountElement.textContent = data.comment_count || 0;
    }

    // 댓글 섹션 제목
    const commentsTitle = document.querySelector('.comments-title');
    if (commentsTitle && data.comment_count) {
        commentsTitle.textContent = `댓글`;
    }
};

// 수정/삭제 버튼 설정 (작성자만 볼 수 있음)
const setBoardActions = (data, myInfo) => {
    const editBtn = document.querySelector('#editBtn');
    const deleteBtn = document.querySelector('#deleteBtn');

    if (myInfo && myInfo.idx === data.writerId) {
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                window.location.href = `/html/board-write.html?post_id=${data.post_id}`;
            });
        }

        if (deleteBtn) {
            deleteBtn.addEventListener('click', async () => {
                const confirmed = confirm('게시글을 삭제하시겠습니까?');
                if (confirmed) {
                    try {
                        const response = await deletePost(data.post_id);
                        if (response.ok) {
                            window.location.href = '/html/index.html';
                        } else {
                            alert('게시글 삭제에 실패하였습니다.');
                        }
                    } catch (error) {
                        console.error('삭제 중 오류:', error);
                        alert('게시글 삭제 중 오류가 발생했습니다.');
                    }
                }
            });
        }
    } else {
        // 작성자가 아니면 버튼 숨기기
        if (editBtn) editBtn.style.display = 'none';
        if (deleteBtn) deleteBtn.style.display = 'none';
    }
};

// 댓글 가져오기
const getBoardComments = async (postId) => {
    try {
        const response = await getComments(postId);
        if (!response.ok) return [];
        const data = await response.json();
        if (response.status !== HTTP_OK) return [];
        return data.data || [];
    } catch (error) {
        console.error('댓글 로드 오류:', error);
        return [];
    }
};

// 댓글 표시
const renderComments = (comments, myInfo) => {
    const commentsList = document.querySelector('#commentsList');
    if (!commentsList) return;

    commentsList.innerHTML = '';

    // 댓글 수 업데이트
    const commentCountElement = document.querySelector('#commentCountDisplay');
    if (commentCountElement) {
        commentCountElement.textContent = comments.length;
    }

    if (!comments || comments.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.textContent = '아직 댓글이 없습니다.';
        emptyMessage.style.color = 'rgba(255,255,255,0.6)';
        emptyMessage.style.textAlign = 'center';
        emptyMessage.style.padding = '24px';
        commentsList.appendChild(emptyMessage);
        return;
    }

    comments.forEach((comment) => {
        const commentItem = document.createElement('div');
        commentItem.className = 'comment-item';
        commentItem.id = `comment-${comment.comment_id}`;

        const isOwner = myInfo && myInfo.idx === comment.writer_id;

        commentItem.innerHTML = `
            <img class="comment-avatar" src="${
                comment.profileImage && comment.profileImage !== 'null'
                    ? `${getServerUrl()}${comment.profileImage}`
                    : DEFAULT_PROFILE_IMAGE
            }" alt="프로필" />
            <div class="comment-content">
                <div class="comment-header">
                    <div>
                        <p class="comment-author">${comment.nickname || '작성자'}</p>
                        <p class="comment-date">${formatDate(comment.created_at)}</p>
                    </div>
                    ${
                        isOwner
                            ? `
                        <div class="comment-actions">
                            <button class="comment-edit-btn" data-comment-id="${comment.comment_id}">수정</button>
                            <button class="comment-delete-btn" data-comment-id="${comment.comment_id}">삭제</button>
                        </div>
                    `
                            : ''
                    }
                </div>
                <p class="comment-text">${comment.comment_content}</p>
            </div>
        `;
        commentsList.appendChild(commentItem);

        // 수정 버튼 이벤트
        if (isOwner) {
            const editBtn = commentItem.querySelector('.comment-edit-btn');
            const deleteBtn = commentItem.querySelector('.comment-delete-btn');

            if (editBtn) {
                editBtn.addEventListener('click', () => {
                    enableEditMode(comment.comment_id, comment.comment_content);
                });
            }

            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => {
                    deleteComment(comment.comment_id);
                });
            }
        }
    });
};

// 댓글 작성
const submitComment = async () => {
    const textarea = document.querySelector('#commentInput');
    const postId = getQueryString('id');

    if (!textarea.value.trim()) {
        alert('댓글을 입력해주세요.');
        return;
    }

    if (textarea.value.length > MAX_COMMENT_LENGTH) {
        alert(`댓글은 ${MAX_COMMENT_LENGTH}자 이하로 입력해주세요.`);
        return;
    }

    try {
        const response = await writeComment(postId, textarea.value);
        if (response.ok) {
            textarea.value = '';
            // 댓글 목록 새로고침
            const comments = await getBoardComments(postId);
            renderComments(comments, window.currentUser);
        } else {
            alert('댓글 작성에 실패하였습니다.');
        }
    } catch (error) {
        console.error('댓글 작성 중 오류:', error);
        alert('댓글 작성 중 오류가 발생했습니다.');
    }
};

// 댓글 수정 모드 활성화
const enableEditMode = (commentId, currentContent) => {
    const commentItem = document.querySelector(`#comment-${commentId}`);
    if (!commentItem) return;

    const commentText = commentItem.querySelector('.comment-text');
    const originalText = commentText.textContent;

    // 수정 인터페이스 생성
    const editContainer = document.createElement('div');
    editContainer.style.display = 'flex';
    editContainer.style.flexDirection = 'column';
    editContainer.style.gap = '8px';
    editContainer.style.marginTop = '8px';

    const editTextarea = document.createElement('textarea');
    editTextarea.value = currentContent;
    editTextarea.style.width = '100%';
    editTextarea.style.minHeight = '60px';
    editTextarea.style.padding = '8px';
    editTextarea.style.backgroundColor = 'rgba(255,255,255,0.05)';
    editTextarea.style.border = '1px solid rgba(255,255,255,0.2)';
    editTextarea.style.color = '#ffffff';
    editTextarea.style.borderRadius = '4px';
    editTextarea.style.fontFamily = 'inherit';
    editTextarea.style.resize = 'none';

    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '8px';
    buttonContainer.style.justifyContent = 'flex-end';

    const saveBtn = document.createElement('button');
    saveBtn.textContent = '저장';
    saveBtn.style.padding = '6px 12px';
    saveBtn.style.backgroundColor = '#3b82f6';
    saveBtn.style.color = '#ffffff';
    saveBtn.style.border = 'none';
    saveBtn.style.borderRadius = '4px';
    saveBtn.style.cursor = 'pointer';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '취소';
    cancelBtn.style.padding = '6px 12px';
    cancelBtn.style.backgroundColor = 'rgba(255,255,255,0.1)';
    cancelBtn.style.color = '#ffffff';
    cancelBtn.style.border = 'none';
    cancelBtn.style.borderRadius = '4px';
    cancelBtn.style.cursor = 'pointer';

    buttonContainer.appendChild(saveBtn);
    buttonContainer.appendChild(cancelBtn);
    editContainer.appendChild(editTextarea);
    editContainer.appendChild(buttonContainer);

    // 원본 텍스트 숨기기 및 수정 폼 표시
    commentText.style.display = 'none';
    commentText.parentNode.insertBefore(editContainer, commentText.nextSibling);

    saveBtn.addEventListener('click', async () => {
        if (!editTextarea.value.trim()) {
            alert('댓글을 입력해주세요.');
            return;
        }

        try {
            // 댓글 수정 API 호출
            await updateComment(commentId, editTextarea.value);
            
            // 댓글 목록 새로고침
            const postId = getQueryString('id');
            const comments = await getBoardComments(postId);
            renderComments(comments, window.currentUser);
            alert('댓글이 수정되었습니다.');
        } catch (error) {
            console.error('댓글 수정 중 오류:', error);
            alert('댓글 수정에 실패하였습니다.');
            editContainer.remove();
            commentText.style.display = 'block';
        }
    });

    cancelBtn.addEventListener('click', () => {
        editContainer.remove();
        commentText.style.display = 'block';
    });
};

// 댓글 삭제
const deleteComment = async (commentId) => {
    const confirmed = confirm('댓글을 삭제하시겠습니까?');
    if (!confirmed) return;

    try {
        await deleteCommentAPI(commentId);
        
        // 댓글 목록 새로고침
        const postId = getQueryString('id');
        const comments = await getBoardComments(postId);
        renderComments(comments, window.currentUser);
    } catch (error) {
        console.error('댓글 삭제 중 오류:', error);
        alert('댓글 삭제에 실패하였습니다.');
    }
};

// 댓글 수정 API (백엔드에서 구현 필요)
const updateComment = async (commentId, newContent) => {
    const postId = getQueryString('id');
    const response = await fetch(`${getServerUrl()}/posts/${postId}/comments/${commentId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            session: getCookie('session'),
            userid: getCookie('userId'),
        },
        body: JSON.stringify({ commentContent: newContent }),
    });

    if (!response.ok) throw new Error('댓글 수정 실패');
    return response.json();
};

// 댓글 삭제 API (백엔드에서 구현 필요)
const deleteCommentAPI = async (commentId) => {
    const postId = getQueryString('id');
    const response = await fetch(`${getServerUrl()}/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
            session: getCookie('session'),
            userid: getCookie('userId'),
        },
    });

    if (!response.ok) throw new Error('댓글 삭제 실패');
    return response.json();
};

// 댓글 입력 이벤트
const setupCommentInput = () => {
    const textarea = document.querySelector('#commentInput');
    const submitBtn = document.querySelector('#submitCommentBtn');

    if (textarea) {
        textarea.addEventListener('input', () => {
            if (textarea.value.length > MAX_COMMENT_LENGTH) {
                textarea.value = textarea.value.substring(0, MAX_COMMENT_LENGTH);
            }
        });
    }

    if (submitBtn) {
        submitBtn.addEventListener('click', submitComment);
    }
};

// 좋아요 버튼
const setupLikeButton = () => {
    const likeBtn = document.querySelector('#likeBtn');
    if (likeBtn) {
        likeBtn.addEventListener('click', async () => {
            const postId = getQueryString('id');
            
            try {
                const response = await toggleLike(postId);
                if (response.ok) {
                    const data = await response.json();
                    console.log('공감 응답:', data);
                    
                    // UI 업데이트
                    likeBtn.classList.toggle('liked');
                    
                    // 공감 수 업데이트 (백엔드에서 반환된 최신 수 사용)
                    const likeCount = document.querySelector('#likeCount');
                    if (data.data && data.data.likeCount !== undefined) {
                        likeCount.textContent = data.data.likeCount;
                    }
                } else {
                    alert('공감 처리에 실패했습니다.');
                }
            } catch (error) {
                console.error('공감 처리 중 오류:', error);
                alert('공감 처리 중 오류가 발생했습니다.');
            }
        });
    }
};

// 사이드바 토글
const setupSidebar = () => {
    const hamburger = document.querySelector('.hamburger');
    const sidebarOverlay = document.querySelector('.sidebar-overlay');

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
            hamburger.setAttribute('aria-expanded', !isExpanded);
            sidebarOverlay.classList.toggle('open');
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', (e) => {
            if (e.target === sidebarOverlay) {
                hamburger.setAttribute('aria-expanded', 'false');
                sidebarOverlay.classList.remove('open');
            }
        });
    }
};

// 페이지 초기화
const init = async () => {
    try {
        // 사용자 인증 확인
        const authResponse = await authCheck();
        const authData = await authResponse.json();
        const myInfo = authData.data;

        // 전역 변수에 저장
        window.currentUser = myInfo;

        // 게시글 ID 가져오기
        const postId = getQueryString('id');
        if (!postId) {
            window.location.href = '/html/index.html';
            return;
        }

        // 게시글 정보 로드
        const boardData = await getBoardDetail(postId);
        if (!boardData) {
            alert('게시글을 찾을 수 없습니다.');
            window.location.href = '/html/index.html';
            return;
        }

        // 게시글 정보 표시
        setBoardDetail(boardData);

        // 수정/삭제 버튼 설정
        setBoardActions(boardData, myInfo);

        // 댓글 설정
        setupCommentInput();

        // 사용자의 공감 여부 확인 및 버튼 상태 초기화
        let isUserLiked = false;
        try {
            const likeResponse = await checkUserLike(postId);
            if (likeResponse.ok) {
                const likeData = await likeResponse.json();
                isUserLiked = likeData.data.liked;
                console.log('사용자 공감 여부:', isUserLiked);
            }
        } catch (error) {
            console.error('공감 여부 확인 중 오류:', error);
        }

        // 좋아요 버튼 설정 (공감 상태 확인 후)
        setupLikeButton();
        
        // 이미 공감했으면 버튼에 liked 클래스 추가
        if (isUserLiked) {
            const likeBtn = document.querySelector('#likeBtn');
            if (likeBtn) {
                likeBtn.classList.add('liked');
                console.log('liked 클래스 추가됨');
            }
        }

        // 사이드바 설정
        setupSidebar();

        // 댓글 로드 및 표시
        const comments = await getBoardComments(postId);
        renderComments(comments, myInfo);
    } catch (error) {
        console.error('페이지 초기화 중 오류:', error);
    }
};

// 페이지 로드 시 초기화
init();