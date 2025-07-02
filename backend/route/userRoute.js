const express = require('express');
const userController = require('../controller/userController.js');
const isLoggedIn = require('../util/authUtil.js');

const router = express.Router();

router.get('/:user_id', isLoggedIn, userController.getUser);
router.get('/auth/check', isLoggedIn, userController.checkAuth);
router.get('/email/check', userController.checkEmail);
router.get('/nickname/check', userController.checkNickname);

router.post('/signup', userController.signupUser);
router.post('/login', userController.loginUser);
router.post('/logout', isLoggedIn, userController.logoutUser);
router.post('/find-id', userController.findUserId);

router.put('/:user_id', isLoggedIn, userController.updateUser);
router.patch('/:user_id/password', isLoggedIn, userController.changePassword);
router.delete('/:user_id', isLoggedIn, userController.softDeleteUser);

module.exports = router;

