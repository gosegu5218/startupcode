import BoardItem from '../component/board/boardItem.js';
import Header from '../component/header/header.js';
import { authCheck, getServerUrl, prependChild } from '../utils/function.js';
import { getPosts } from '../api/indexRequest.js';


const DEFAULT_PROFILE_IMAGE = '../public/image/profile/default.jpg';
const HTTP_NOT_AUTHORIZED = 401;
const SCROLL_THRESHOLD = 0.9;
const INITIAL_OFFSET = 0;
const ITEMS_PER_LOAD = 5;

// ✅ 렌더링된 게시글 ID 추적용
const renderedPostIds = new Set();

// 게시글 데이터 가져오기
const getBoardItem = async (offset = 0, limit = 5) => {
    const response = await getPosts(offset, limit);
    if (!response.ok) {
        throw new Error('Failed to load post list.');
    }
    const data = await response.json();
    return data.data;
};

// 게시글 리스트 렌더링
const setBoardItem = boardData => {
    const boardList = document.querySelector('.boardList');
    if (!boardList || !boardData) return;

    boardData.forEach(data => {
        // ✅ 이미 렌더링된 게시글은 건너뜀
        if (renderedPostIds.has(data.post_id)) return;

        const itemHtml = BoardItem(
            data.post_id,
            data.created_at,
            data.post_title,
            data.hits,
            data.profileImagePath === null ? null : data.profileImagePath,
            data.nickname,
            data.comment_count,
            data.like,
        );
        if (typeof itemHtml === 'string') {
            const wrapper = document.createElement('div');
            wrapper.innerHTML = itemHtml;
            boardList.appendChild(wrapper.firstElementChild);
        }

        renderedPostIds.add(data.post_id); // ✅ 렌더링 기록
    });
};

// 무한 스크롤 이벤트
const addInfinityScrollEvent = () => {
    let offset = INITIAL_OFFSET + ITEMS_PER_LOAD;
    let isEnd = false;
    let isProcessing = false;

    window.addEventListener('scroll', async () => {
        const scrollTrigger =
            window.scrollY + window.innerHeight >=
            document.documentElement.scrollHeight * SCROLL_THRESHOLD;

        if (scrollTrigger && !isProcessing && !isEnd) {
            isProcessing = true;

            try {
                const newItems = await getBoardItem(offset, ITEMS_PER_LOAD);
                if (!newItems || newItems.length === 0) {
                    isEnd = true;
                } else {
                    offset += ITEMS_PER_LOAD;
                    setBoardItem(newItems);
                }
            } catch (error) {
                console.error('Error fetching new items:', error);
                isEnd = true;
            } finally {
                isProcessing = false;
            }
        }
    });
};

// 초기화 함수
const init = async () => {
    try {
        const response = await authCheck();
        const data = await response.json();

        if (response.status === HTTP_NOT_AUTHORIZED) {
            window.location.href = '/html/login.html';
            return;
        }

        const profileImagePath =
            data.data.profileImagePath === null
                ? DEFAULT_PROFILE_IMAGE
                : `${getServerUrl()}${data.data.profileImagePath}`;

        prependChild(document.body, Header('Community', 0, profileImagePath));

        const boardList = await getBoardItem(INITIAL_OFFSET, ITEMS_PER_LOAD);
        setBoardItem(boardList);

        addInfinityScrollEvent();
    } catch (error) {
        console.error('Initialization failed:', error);
    }
};

init();
