const express = require('express');
const router = express.Router();
const LandingController = require('./landing.controller');

router.get('/', LandingController.getConfig);
router.put('/', LandingController.updateConfig);

module.exports = router;