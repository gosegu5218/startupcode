const express = require('express');
const postController = require('../controller/postController.js');
const isLoggedIn = require('../util/authUtil.js');

const router = express.Router();

router.get('/', isLoggedIn, postController.getPosts); // 전체 게시글
router.get('/:post_id', isLoggedIn, postController.getPost); // 상세
router.post('/', isLoggedIn, postController.writePost); // 작성
router.patch('/:post_id', isLoggedIn, postController.updatePost); // 수정
router.delete('/:post_id', isLoggedIn, postController.softDeletePost); // 삭제

module.exports = router;
