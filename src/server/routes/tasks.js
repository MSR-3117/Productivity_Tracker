const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const { validateDateQuery, validateTaskCreate, validateTaskUpdate } = require('../middleware/validate');
const taskController = require('../controllers/taskController');

const router = express.Router();

// All task routes require JWT authentication
router.use(authenticateJWT);

router.get('/', validateDateQuery, taskController.getTasks);
router.post('/', validateTaskCreate, taskController.createTask);
router.put('/:id', validateTaskUpdate, taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

module.exports = router;
