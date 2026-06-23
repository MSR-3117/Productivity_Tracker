const taskService = require('../services/taskService');

async function getTasks(req, res) {
    try {
        const { date } = req.query;
        const tasks = await taskService.getTasksByDate(req.userId, date);
        res.json({ tasks });
    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function createTask(req, res) {
    try {
        const task = await taskService.createTask(req.userId, req.body);
        res.status(201).json({ task });
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function updateTask(req, res) {
    try {
        const { id } = req.params;
        const task = await taskService.updateTask(req.userId, id, req.body);
        
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json({ task });
    } catch (error) {
        if (error.message === 'Status must be "todo" or "done"' || error.message === 'No fields to update') {
            return res.status(400).json({ error: error.message });
        }
        console.error('Update task error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function deleteTask(req, res) {
    try {
        const { id } = req.params;
        const task = await taskService.softDeleteTask(req.userId, id);
        
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json({ message: 'Task deleted' });
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = {
    getTasks,
    createTask,
    updateTask,
    deleteTask
};
