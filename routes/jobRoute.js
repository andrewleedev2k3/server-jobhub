const express = require('express');
const router = express.Router();

const filesMiddleware = require('../middleware/filesMiddleware');

const authMiddleware = require('../middleware/authMiddleware');
const jobController = require('../controller/jobController');
const jobApplicationController = require('../controller/jobApplicationController');
const JobModel = require('../model/jobModel');
const Job = require('../model/jobModel');

router.get('/applicationSentToMe', authMiddleware.protectLogin, jobApplicationController.getAllApplicationOfMyCompany);
router.get(
    '/application/:id',
    authMiddleware.protectLogin,
    authMiddleware.checkOwner(Job, 'postedBy'),
    jobApplicationController.getAllApplicationOfJob,
);
router.post('/cancel/:id', authMiddleware.protectLogin, jobApplicationController.cancelJobApplication);
router.post('/accept/:id', authMiddleware.protectLogin, jobApplicationController.acceptJobApplication);
router.post('/remove/:id', authMiddleware.protectLogin, jobApplicationController.removeJobApplication);
router.post('/apply/:id', authMiddleware.protectLogin, jobApplicationController.applyJob);

router.post('/reject/:id', authMiddleware.protectLogin, authMiddleware.restrictTo('admin'), jobController.rejectJob);
router.post('/approve/:id', authMiddleware.protectLogin, authMiddleware.restrictTo('admin'), jobController.approveJob);
router.patch(
    '/restore/:id',
    authMiddleware.protectLogin,
    authMiddleware.checkOwner(JobModel, 'postedBy'),
    jobController.restoreJob,
);

router.delete(
    '/remove/:id',
    authMiddleware.protectLogin,
    authMiddleware.checkOwner(JobModel, 'postedBy'),
    jobController.removeJob,
);

router.delete(
    '/:id',
    authMiddleware.protectLogin,
    authMiddleware.checkOwner(JobModel, 'postedBy'),
    jobController.deleteJob,
);

router.post('/comment/:id', authMiddleware.protectLogin, jobController.commentJob);
router.post(
    '/',
    authMiddleware.protectLogin,
    filesMiddleware.uploadMultiplePhoto('photosJob', 10),
    filesMiddleware.resizePhoto('jobs'),
    jobController.createJob,
);

router.get('/all', authMiddleware.protectLogin, authMiddleware.restrictTo('admin'), jobController.getAllJob);
router.get(
    '/notAccept',
    authMiddleware.protectLogin,
    authMiddleware.restrictTo('admin'),
    jobController.getAllJobNotAcceptYet,
);
router.get('/deleted', authMiddleware.protectLogin, jobController.getAllJobDeleted);
router.get('/:id', jobController.getJob);
router.get('/', jobController.getAllJobAccepted);
module.exports = router;
