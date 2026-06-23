const TimeBlock = require('../models/TimeBlock');

async function getTimeBlocks(userId) {
    return await TimeBlock.find({ userId }).sort({ start_time: 1 });
}

async function createTimeBlock(userId, data) {
    if (!data.name || !data.start_time || !data.end_time) {
        throw new Error('Name, start_time, and end_time are required');
    }

    return await TimeBlock.create({
        userId,
        name: data.name,
        start_time: data.start_time,
        end_time: data.end_time,
        color: data.color || '#6366f1',
        icon: data.icon || '📚',
    });
}

async function updateTimeBlock(userId, id, data) {
    const updates = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.start_time !== undefined) updates.start_time = data.start_time;
    if (data.end_time !== undefined) updates.end_time = data.end_time;
    if (data.color !== undefined) updates.color = data.color;
    if (data.icon !== undefined) updates.icon = data.icon;

    return await TimeBlock.findOneAndUpdate(
        { _id: id, userId },
        { $set: updates },
        { new: true }
    );
}

async function deleteTimeBlock(userId, id) {
    return await TimeBlock.findOneAndDelete({
        _id: id,
        userId,
    });
}

module.exports = {
    getTimeBlocks,
    createTimeBlock,
    updateTimeBlock,
    deleteTimeBlock
};
