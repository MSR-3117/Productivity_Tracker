const timeblockService = require('../services/timeblockService');

async function getTimeBlocks(req, res) {
    try {
        const timeBlocks = await timeblockService.getTimeBlocks(req.userId);
        res.json({ timeBlocks });
    } catch (error) {
        console.error('Get time blocks error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function createTimeBlock(req, res) {
    try {
        const timeBlock = await timeblockService.createTimeBlock(req.userId, req.body);
        res.status(201).json({ timeBlock });
    } catch (error) {
        if (error.message === 'Name, start_time, and end_time are required') {
            return res.status(400).json({ error: error.message });
        }
        console.error('Create time block error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function updateTimeBlock(req, res) {
    try {
        const { id } = req.params;
        const timeBlock = await timeblockService.updateTimeBlock(req.userId, id, req.body);
        
        if (!timeBlock) {
            return res.status(404).json({ error: 'Time block not found' });
        }

        res.json({ timeBlock });
    } catch (error) {
        console.error('Update time block error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function deleteTimeBlock(req, res) {
    try {
        const { id } = req.params;
        const timeBlock = await timeblockService.deleteTimeBlock(req.userId, id);
        
        if (!timeBlock) {
            return res.status(404).json({ error: 'Time block not found' });
        }

        res.json({ message: 'Time block deleted' });
    } catch (error) {
        console.error('Delete time block error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = {
    getTimeBlocks,
    createTimeBlock,
    updateTimeBlock,
    deleteTimeBlock
};
