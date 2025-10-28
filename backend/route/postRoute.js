const express = require('express');
const postController = require('../controller/postController.js');
const isLoggedIn = require('../util/authUtil.js');

const router = express.Router();

// 목록과 작성
router.get('/', isLoggedIn, postController.getPosts); // 전체 게시글
router.post('/', isLoggedIn, postController.writePost); // 작성

// 더 구체적인 라우트들을 먼저 정의해야 함
router.get('/:post_id/like/check', isLoggedIn, postController.checkUserLike); // 사용자 공감 여부 확인
router.post('/:post_id/like', isLoggedIn, postController.toggleLike); // 공감 추가/취소

// 일반적인 라우트들은 마지막에
router.get('/:post_id', isLoggedIn, postController.getPost); // 상세
router.patch('/:post_id', isLoggedIn, postController.updatePost); // 수정
router.delete('/:post_id', isLoggedIn, postController.softDeletePost); // 삭제

module.exports = router;
