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
let allPosts = []; // 모든 게시글 저장용
let isSearching = false; // 검색 상태 플래그

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

        const itemHtml = BoardItem(
            data.post_id,
            data.created_at,
            data.post_title,
            data.hits,
            data.filePath,
            data.profileImagePath,
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
let offset = INITIAL_OFFSET + ITEMS_PER_LOAD;
let isEnd = false;
let isProcessing = false;

const addInfinityScrollEvent = () => {
    window.addEventListener('scroll', async () => {
        // 검색 중에는 무한 스크롤 비활성화
        if (isSearching) return;

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
                    allPosts = [...allPosts, ...newItems]; // allPosts에 새 게시글 추가
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

// 검색 함수
const searchPosts = (searchTerm) => {
    const boardList = document.querySelector('.boardList');
    if (!boardList) return;

    if (!searchTerm.trim()) {
        // 검색어가 없으면 모든 게시글 표시
        isSearching = false;
        // 무한 스크롤 상태 리셋
        offset = INITIAL_OFFSET + ITEMS_PER_LOAD;
        isEnd = false;
        isProcessing = false;
        
        boardList.innerHTML = '';
        renderedPostIds.clear();
        setBoardItem(allPosts);
        return;
    }

    isSearching = true;
    const lowerSearchTerm = searchTerm.toLowerCase();

    // 제목과 내용으로 필터링
    const filteredPosts = allPosts.filter(post => 
        post.post_title.toLowerCase().includes(lowerSearchTerm) ||
        post.post_content.toLowerCase().includes(lowerSearchTerm)
    );

    // 검색 결과 표시
    boardList.innerHTML = '';
    renderedPostIds.clear();

    if (filteredPosts.length === 0) {
        const noResult = document.createElement('div');
        noResult.style.padding = '40px';
        noResult.style.textAlign = 'center';
        noResult.style.color = 'rgba(255,255,255,0.6)';
        noResult.style.fontSize = '16px';
        noResult.style.width = '100%';
        noResult.textContent = '검색 결과가 없습니다.';
        boardList.appendChild(noResult);
    } else {
        setBoardItem(filteredPosts);
    }
};

// 검색 입력 이벤트 설정
const setupSearchEvent = () => {
    const searchInput = document.querySelector('.search-pill input');
    const searchButton = document.querySelector('.search-pill button');

    if (searchInput) {
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                searchPosts(searchInput.value);
            }
        });

        // 실시간 검색
        searchInput.addEventListener('input', (e) => {
            searchPosts(e.target.value);
        });
    }

    if (searchButton) {
        searchButton.addEventListener('click', () => {
            searchPosts(searchInput.value);
        });
    }
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

        // 처음 게시글들 로드
        const initialPosts = await getBoardItem(INITIAL_OFFSET, ITEMS_PER_LOAD);
        allPosts = [...initialPosts]; // 모든 게시글 저장
        setBoardItem(initialPosts);

        // 검색 이벤트 설정
        setupSearchEvent();

        // 무한 스크롤 이벤트 추가
        addInfinityScrollEvent();
    } catch (error) {
        console.error('Initialization failed:', error);
    }
};

init();
