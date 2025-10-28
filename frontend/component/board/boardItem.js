import { padTo2Digits, getServerUrl } from '../../utils/function.js';

const BoardItem = (
    postId,
    date,
    postTitle,
    hits,
    postFilePath,
    profileImagePath,
    writer,
    commentCount,
    like,
) => {
    // 파라미터 값이 없으면 리턴
    if (
        !date ||
        !postTitle ||
        hits === undefined ||
        like === undefined ||
        commentCount === undefined ||
        !writer
    ) {
        return;
    }

    // 날짜 포맷 변경 YYYY-MM-DD hh:mm:ss
    const dateObj = new Date(date);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
    const hours = dateObj.getHours();
    const minutes = dateObj.getMinutes();
    const seconds = dateObj.getSeconds();

    const formattedDate = `${year}-${padTo2Digits(month)}-${padTo2Digits(day)} ${padTo2Digits(hours)}:${padTo2Digits(minutes)}:${padTo2Digits(seconds)}`;

    const DEFAULT_PROFILE_IMAGE = '../public/image/profile/default.jpg';
    
    // 게시물 첨부파일 (cover image)
    const postImageUrl = postFilePath === null ? DEFAULT_PROFILE_IMAGE : `${getServerUrl()}${postFilePath}`;
    
    // 프로필 사진 (writer info)
    const profileUrl = profileImagePath === null ? DEFAULT_PROFILE_IMAGE : `${getServerUrl()}${profileImagePath}`;

    return `
    <a href="/html/board.html?id=${postId}">
        <div class="boardItem">
            <div class="cover">
                <img src="${postImageUrl}" alt="cover image" />
            </div>
            <div class="titleRow">
                <h2 class="title">${postTitle}</h2>
                <div class="writerInfo">
                    <picture class="img">
                        <img src="${profileUrl}" alt="profile">
                    </picture>
                    <h2 class="writer">${writer}</h2>
                </div>
            </div>
            <div class="info">
                <h3 class="views">댓글 <b>${commentCount}</b></h3>
                <h3 class="views">조회수 <b>${hits}</b></h3>
                <p class="date">${formattedDate}</p>
            </div>
        </div>
    </a>
`;
};

export default BoardItem;