const express = require('express');
const router = express.Router();

const userController = require('../controller/userController');
const authController = require('../controller/authController');
const authMiddleware = require('../middleware/authMiddleware');
const filesMiddleware = require('../middleware/filesMiddleware');
// find all users

router.patch('/unban/:id', authMiddleware.protectLogin, authMiddleware.restrictTo('admin'), userController.unbanUser);
router.patch('/ban/:id', authMiddleware.protectLogin, authMiddleware.restrictTo('admin'), userController.banUser);

router.post('/unfollow/:id', authMiddleware.protectLogin, userController.unFollowUser);
router.post('/follow/:id', authMiddleware.protectLogin, userController.followUser);
router.patch(
    '/changeMe',
    filesMiddleware.uploadSinglePhoto('photo'),
    filesMiddleware.resizePhoto('users'),
    authMiddleware.protectLogin,
    userController.changeMe,
);
router.patch('/updateMyPassword', authMiddleware.protectLogin, authController.updateMyPassword);
router.get('/getMe', authMiddleware.protectLogin, userController.getMe);
router.get('/banned', authMiddleware.protectLogin, authMiddleware.restrictTo('admin'), userController.getAllUserBanned);
router.get('/:id', userController.getUser);
router.get('/', userController.getAllUser);

module.exports = router;
