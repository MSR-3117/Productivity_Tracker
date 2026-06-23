const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const metricsController = require('../controllers/metricsController');

const router = express.Router();

router.use(authenticateJWT);

router.get('/monthly', metricsController.getMonthly);
router.get('/streaks', metricsController.getStreaks);
router.get('/analytics', metricsController.getAnalytics);

module.exports = router;
