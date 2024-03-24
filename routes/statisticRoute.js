const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const statisticController = require('../controller/statisticController');

router.use(authMiddleware.protectLogin, authMiddleware.restrictTo('admin'));

router.get('/statisticTotal', statisticController.getStatisticTotal);
router.get('/topJob', statisticController.getTopJob);
router.get('/topCompany', statisticController.getTopCompany);
router.get('/jobMonthly', statisticController.getStatisticJob);

module.exports = router;
