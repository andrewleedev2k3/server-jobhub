const express = require('express');
const router = express.Router();

const utilsController = require('../controller/utilsController');

router.get('/getSkills', utilsController.getSkills);
router.get('/getLocation', utilsController.getLocation);
router.get('/getDistrict', utilsController.getDistrict);
router.get('/getCity/:code', utilsController.getCity);
router.get('/getCity', utilsController.getAllCity);

module.exports = router;
