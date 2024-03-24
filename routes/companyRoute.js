const express = require('express');
const router = express.Router();

const filesMiddleware = require('../middleware/filesMiddleware');
const companyController = require('../controller/companyController');
const authMiddleware = require('../middleware/authMiddleware');

router.patch(
    '/changeMe',
    filesMiddleware.uploadSinglePhoto('coverPhoto'),
    filesMiddleware.resizePhoto('company'),
    authMiddleware.protectLogin,
    companyController.changeMe,
);
router.get('/myJobCreated', authMiddleware.protectLogin, companyController.getAllMyJobCreated);
router.get('/:id', companyController.getCompany);
router.get('/', companyController.getAllCompany);

module.exports = router;
