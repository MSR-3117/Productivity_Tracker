const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const timeblockController = require('../controllers/timeblockController');

const router = express.Router();

router.use(authenticateJWT);

router.get('/', timeblockController.getTimeBlocks);
router.post('/', timeblockController.createTimeBlock);
router.put('/:id', timeblockController.updateTimeBlock);
router.delete('/:id', timeblockController.deleteTimeBlock);

module.exports = router;
