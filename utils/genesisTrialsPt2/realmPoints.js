const { DiscordUserSchema } = require('../schemas');
const mongoose = require('mongoose');

const checkRealmPointsCollected = async (userId) => {
    try {
        const User = mongoose.model('UserData', DiscordUserSchema, 'RHDiscordUserData');
        const userQuery = await User.findOne({ userId: userId });

        if (!userQuery) {
            return {
                status: 'error',
                message: 'You have not collected any Favor Points yet.',
            };
        } else {
            return {
                status: 'success',
                message: `You have collected ${userQuery.realmPoints} Favor Points so far. Keep it up and enjoy the rewards later!`,
            };
        }
    } catch (err) {
        console.log({
            errorFrom: 'checkRealmPointsCollected',
            errorMessage: err,
        });
    }
};

const checkRealmPointsButton = () => {
    return [
        {
            type: 1,
            components: [
                {
                    type: 2,
                    style: 1,
                    label: 'Check collected Favor Points',
                    custom_id: 'checkRealmPointsCollectedButton',
                },
            ],
        },
    ];
};

module.exports = {
    checkRealmPointsCollected,
    checkRealmPointsButton,
};
