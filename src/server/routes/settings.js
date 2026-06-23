const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const settingsController = require('../controllers/settingsController');

const router = express.Router();

router.use(authenticateJWT);

router.get('/', settingsController.getSettings);
router.put('/', settingsController.updateSettings);

module.exports = router;
