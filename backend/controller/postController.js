const postModel = require('../model/postModel.js');
const {
    STATUS_CODE,
    STATUS_MESSAGE
} = require('../util/constant/httpStatusCode');
const path = require('path');
const yoloUtil = require('../util/yoloUtil');
const commentModel = require('../model/commentModel');
const fs = require('fs');

/**
 * 게시글 작성
 * 게시글 목록 조회
 * 게시글 상세 조회
 * 게시글 수정
 * 게시글 삭제
 */

// 게시글 작성
exports.writePost = async (request, response, next) => {
    const { userid: userId } = request.headers;
    const { postTitle, postContent, attachFilePath } = request.body;

    try {
        if (!postTitle) {
            const error = new Error(STATUS_MESSAGE.INVALID_POST_TITLE);
            error.status = STATUS_CODE.BAD_REQUEST;
            throw error;
        }

        if (postTitle.length > 26) {
            const error = new Error(STATUS_MESSAGE.INVALID_POST_TITLE_LENGTH);
            error.status = STATUS_CODE.BAD_REQUEST;
            throw error;
        }

        if (!postContent) {
            const error = new Error(STATUS_MESSAGE.INVALID_POST_CONTENT);
            error.status = STATUS_CODE.BAD_REQUEST;
            throw error;
        }

        if (postContent.length > 1500) {
            const error = new Error(STATUS_MESSAGE.INVALID_POST_CONTENT_LENGHT);
            error.status = STATUS_CODE.BAD_REQUEST;
            throw error;
        }

        const requestData = {
            userId,
            postTitle,
            postContent,
            attachFilePath: attachFilePath || null,
        };
    const responseData = await postModel.writePost(requestData);

        if (responseData === STATUS_MESSAGE.NOT_FOUND_USER) {
            const error = new Error(STATUS_MESSAGE.NOT_FOUND_USER);
            error.status = STATUS_CODE.NOT_FOUND;
            throw error;
        }

        if (!responseData) {
            const error = new Error(STATUS_MESSAGE.WRITE_POST_FAILED);
            error.status = STATUS_CODE.INTERNAL_SERVER_ERROR;
            throw error;
        }

    // Trigger YOLO detection and automatic comment asynchronously
    tryDetectAndComment(responseData.insertId || responseData.post_id || null, userId, attachFilePath);

        return response.status(STATUS_CODE.CREATED).json({
            message: STATUS_MESSAGE.WRITE_POST_SUCCESS,
            data: responseData,
        });
    } catch (error) {
        next(error);
    }
};

// After creating post, if attachFilePath exists we run YOLO detection and add a comment
// Note: this adds a comment authored by the same user who created the post.
async function tryDetectAndComment(postId, userId, attachFilePath) {
    if (!attachFilePath) return;
    try {
        // attachFilePath expected like: /public/image/post/filename.jpg
        // sanitize and convert to absolute path on server
        const projectRoot = path.resolve(__dirname, '..'); // backend folder
        // remove leading slashes so path.join doesn't treat it as absolute
        const relPath = attachFilePath.replace(/^[/\\]+/, '');
        const imagePath = path.join(projectRoot, relPath);

        console.log('[tryDetectAndComment] postId:', postId, 'userId:', userId, 'attachFilePath:', attachFilePath, 'resolvedImagePath:', imagePath);

        // Wait for file to exist (race-condition protection): retry a few times
        const maxAttempts = 5;
        const delayMs = 200;
        let exists = fs.existsSync(imagePath);
        for (let i = 0; i < maxAttempts && !exists; i++) {
            // eslint-disable-next-line no-await-in-loop
            await new Promise((res) => setTimeout(res, delayMs));
            exists = fs.existsSync(imagePath);
            console.log(`[tryDetectAndComment] wait for file attempt=${i + 1} exists=${exists}`);
        }
        if (!exists) {
            console.error('[tryDetectAndComment] image file not found after retries:', imagePath);
            return;
        }

        const resultText = await yoloUtil.detectImage(imagePath).catch((e) => {
            // don't throw to avoid failing post creation; log full error
            console.error('[tryDetectAndComment] YOLO detection error:', e && e.stack ? e.stack : e.message || e);
            return null;
        });

        console.log('[tryDetectAndComment] detection resultText:', resultText);

        if (!resultText) return;

        // 깔끔한 문장 형태로 정리
        let commentContent = '';
        if (typeof resultText === 'string' && resultText.includes('검출 결과 없음')) {
            commentContent = '자동 분석 결과: 검출된 객체가 없습니다.';
        } else {
            // 결과 문자열을 그대로 사용하되 마침표 추가
            commentContent = `자동 분석 결과는 ${resultText}입니다.`;
        }
        const writeResult = await commentModel.writeComment({ postId, userId, commentContent }).catch(err => {
            console.error('[tryDetectAndComment] writeComment error:', err && err.stack ? err.stack : err.message || err);
            return null;
        });

        console.log('[tryDetectAndComment] comment writeResult:', writeResult);
    } catch (err) {
        console.error('tryDetectAndComment failed:', err.message || err);
    }
}

// 게시글 목록 조회
exports.getPosts = async (request, response, next) => {
    const { offset, limit } = request.query;

    try {
        if (!offset || !limit) {
            const error = new Error(STATUS_MESSAGE.INVALID_OFFSET_OR_LIMIT);
            error.status = STATUS_CODE.BAD_REQUEST;
            throw error;
        }
        const requestData = {
            offset: parseInt(offset, 10),
            limit: parseInt(limit, 10),
        };
        const responseData = await postModel.getPosts(requestData);

        if (!responseData || responseData.length === 0) {
            const error = new Error(STATUS_MESSAGE.NOT_A_SINGLE_POST);
            error.status = STATUS_CODE.NOT_FOUND;
            throw error;
        }

        return response.status(STATUS_CODE.OK).json({
            message: STATUS_MESSAGE.GET_POSTS_SUCCESS,
            data: responseData,
        });
    } catch (error) {
        next(error);
    }
};

// 게시글 상세 조회
exports.getPost = async (request, response, next) => {
    const { post_id: postId } = request.params;

    try {
        if (!postId) {
            const error = new Error(STATUS_MESSAGE.INVALID_POST_ID);
            error.status = STATUS_CODE.BAD_REQUEST;
            throw error;
        }

        const requestData = {
            postId
        };
        const responseData = await postModel.getPost(requestData, response);

        if (!responseData) {
            const error = new Error(STATUS_MESSAGE.NOT_A_SINGLE_POST);
            error.status = STATUS_CODE.NOT_FOUND;
            throw error;
        }

        return response.status(STATUS_CODE.OK).json({
            message: null,
            data: responseData
        });
    } catch (error) {
        return next(error);
    }
};

// 게시글 수정
exports.updatePost = async (request, response, next) => {
    const { post_id: postId } = request.params;
    const { userid: userId } = request.headers;
    const { postTitle, postContent, attachFilePath } = request.body;

    try {
        if (!postId) {
            const error = new Error(STATUS_MESSAGE.INVALID_POST_ID);
            error.status = STATUS_CODE.BAD_REQUEST;
            throw error;
        }

        if (postTitle.length > 26) {
            const error = new Error(STATUS_MESSAGE.INVALID_POST_TITLE_LENGTH);
            error.status = STATUS_CODE.BAD_REQUEST;
            throw error;
        }

        const requestData = {
            postId,
            userId,
            postTitle,
            postContent,
            attachFilePath: attachFilePath || null,
        };
        const responseData = await postModel.updatePost(requestData);

        if (!responseData) {
            const error = new Error(STATUS_MESSAGE.NOT_A_SINGLE_POST);
            error.status = STATUS_CODE.NOT_FOUND;
            throw error;
        }

        return response.status(STATUS_CODE.OK).json({
            message: STATUS_MESSAGE.UPDATE_POST_SUCCESS,
            data: responseData,
        });
    } catch (error) {
        next(error);
    }
};

// 게시글 삭제
exports.softDeletePost = async (request, response, next) => {
    const { post_id: postId } = request.params;

    try {
        if (!postId) {
            const error = new Error(STATUS_MESSAGE.INVALID_POST_ID);
            error.status = STATUS_CODE.BAD_REQUEST;
            throw error;
        }

        const requestData = {
            postId
        };
        const results = await postModel.softDeletePost(requestData);

        if (!results) {
            const error = new Error(STATUS_MESSAGE.NOT_A_SINGLE_POST);
            error.status = STATUS_CODE.NOT_FOUND;
            throw error;
        }

        return response.status(STATUS_CODE.OK).json({
            message: STATUS_MESSAGE.DELETE_POST_SUCCESS,
            data: null
        });
    } catch (error) {
        return next(error);
    }
};
