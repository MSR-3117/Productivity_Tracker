const UserSettings = require('../models/UserSettings');

async function getSettings(userId) {
    let settings = await UserSettings.findOne({ userId });

    if (!settings) {
        settings = await UserSettings.create({
            userId,
            theme: 'dark',
        });
    }

    return settings;
}

async function updateSettings(userId, data) {
    if (data.theme && !['dark', 'light'].includes(data.theme)) {
        throw new Error('Theme must be "dark" or "light"');
    }

    const updates = {};
    if (data.theme !== undefined) updates.theme = data.theme;
    if (data.notifications !== undefined) updates.notifications = data.notifications;
    if (data.plannerPreferences !== undefined) updates.plannerPreferences = data.plannerPreferences;

    const settings = await UserSettings.findOneAndUpdate(
        { userId },
        { $set: updates },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return settings;
}

module.exports = {
    getSettings,
    updateSettings
};
