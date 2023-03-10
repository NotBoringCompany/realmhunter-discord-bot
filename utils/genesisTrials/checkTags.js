const mongoose = require('mongoose');
const { DiscordUserSchema } = require('../schemas');

/**
 * Checks how many tags a user has collected.
 */
const checkTagsCollected = async (userId) => {
    try {
        const User = mongoose.model('UserData', DiscordUserSchema, 'RHDiscordUserData');
        const userQuery = await User.findOne({ userId: userId });

        if (!userQuery) {
            return {
                status: 'error',
                message: 'You have not collected any cookies yet.',
            };
        } else {
            return {
                status: 'success',
                message: `You have collected ${userQuery.hunterTags} cookies so far. Keep it up and the Gatekeeper may be happy.`,
            };
        }
    } catch (err) {
        console.log({
            errorFrom: 'checkTagsCollected',
            errorMessage: err,
        });
    }
};

module.exports = {
    checkTagsCollected,
};
