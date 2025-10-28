import BoardItem from '../component/board/boardItem.js';
import { authCheck, getServerUrl } from '../utils/function.js';
import { getPosts } from '../api/indexRequest.js';


const DEFAULT_PROFILE_IMAGE = '../public/image/profile/default.jpg';
const HTTP_NOT_AUTHORIZED = 401;
const SCROLL_THRESHOLD = 0.9;
const INITIAL_OFFSET = 0;
const ITEMS_PER_LOAD = 3; // load 3 posts per scroll as requested

// ✅ 렌더링된 게시글 ID 추적용
const renderedPostIds = new Set();

// 게시글 데이터 가져오기
const getBoardItem = async (offset = 0, limit = ITEMS_PER_LOAD) => {
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

    boardData.forEach((data, idx) => {
        // ✅ 이미 렌더링된 게시글은 건너뜀
        if (renderedPostIds.has(data.post_id)) return;

        const imagePath = data.filePath ? data.filePath : data.profileImagePath;
        const itemHtml = BoardItem(
            data.post_id,
            data.created_at,
            data.post_title,
            data.hits,
            imagePath === null ? null : imagePath,
            data.nickname,
            data.comment_count,
            data.like,
        );
        if (typeof itemHtml === 'string') {
            const wrapper = document.createElement('div');
            wrapper.innerHTML = itemHtml;
            const element = wrapper.firstElementChild; // this is the <a> wrapper

            // add animation/entrance classes
            element.classList.add('board-card');
            // stagger animation per item in the batch
            element.style.transitionDelay = `${(idx % ITEMS_PER_LOAD) * 90}ms`;

            boardList.appendChild(element);

            // trigger the enter animation on next frame
            requestAnimationFrame(() => {
                element.classList.add('in');
            });
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

        // header intentionally omitted on the community listing per request

        const boardList = await getBoardItem(INITIAL_OFFSET, ITEMS_PER_LOAD);
        setBoardItem(boardList);

        addInfinityScrollEvent();
    } catch (error) {
        console.error('Initialization failed:', error);
    }
};

init();
