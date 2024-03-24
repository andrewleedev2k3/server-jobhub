const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const categoryJobController = require('../controller/categoryJobController');

router.patch(
    '/:id',
    authMiddleware.protectLogin,
    authMiddleware.restrictTo('admin'),
    categoryJobController.changeCategoryJob,
);
router.delete(
    '/:id',
    authMiddleware.protectLogin,
    authMiddleware.restrictTo('admin'),
    categoryJobController.deleteCategoryJob,
);
router.post(
    '/',
    authMiddleware.protectLogin,
    authMiddleware.restrictTo('admin'),
    categoryJobController.createCategoryJob,
);
router.get('/', categoryJobController.getAllCategoryJob);

module.exports = router;
