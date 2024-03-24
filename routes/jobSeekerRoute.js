const express = require('express');
const router = express.Router();

const jobApplicationController = require('../controller/jobApplicationController');
const jobSeekerController = require('../controller/jobSeekerController');
const filesMiddleware = require('../middleware/filesMiddleware');
const authMiddleware = require('../middleware/authMiddleware');

// find all users
router.patch(
    '/changeMe',
    filesMiddleware.uploadSinglePhoto('cvImage'),
    filesMiddleware.resizePhoto('jobSeekers'),
    authMiddleware.protectLogin,
    jobSeekerController.changeMe,
);
router.get('/myApplication', authMiddleware.protectLogin, jobApplicationController.getAllMyJobApplicated);
router.get('/:id', jobSeekerController.getJobSeeker);
router.get('/', jobSeekerController.getAllJobSeeker);

module.exports = router;
