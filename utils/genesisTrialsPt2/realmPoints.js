const { DiscordUserSchema } = require('../schemas');
const mongoose = require('mongoose');
const { realmPointsLeaderboardEmbed } = require('../../embeds/genesisTrialsPt2/realmPoints');
const cron = require('node-cron');

const realmPointsLeaderboardLogic = async (client) => {
    try {
        const User = mongoose.model('UserData', DiscordUserSchema, 'RHDiscordUserData');
        // get the top 20 users with the most realm points.
        const userQuery = await User.find({}).sort({ realmPoints: -1 }).limit(20);

        // if no users yet, we return an empty embed.
        if (!userQuery) {
            return {
                embed: realmPointsLeaderboardEmbed(
                    [{
                        name: 'Leaderboard',
                        value: 'No users yet.',
                    }]),
                status: 'success',
                message: 'No users yet.',
            };
        } else {
            const leaderboard = [];
            for (let i = 0; i < userQuery.length; i++) {
                const user = userQuery[i];

                const userId = user.userId;

                leaderboard.push({
                    name: `${i + 1}. <@${userId}>`,
                    value: `${user.realmPoints} Favor Points`,
                });
            }

            return {
                embed: realmPointsLeaderboardEmbed(leaderboard),
                status: 'success',
                message: 'Successfully retrieved the leaderboard.',
            };
        }
    } catch (err) {
        console.log({
            errorFrom: 'realmPointsLeaderboardLogic',
            errorMessage: err,
        });
    }
};

const showRealmPointsLeaderboard = async () => {
    try {
        return await realmPointsLeaderboardLogic();
    } catch (err) {
        throw err;
    }
};

/**
 * Updates the realm points leaderboard every 10 minutes.
 */
const realmPointsLeaderboardScheduler = async (msgId, client) => {
    try {
        // every 10 minutes
        cron.schedule('*/10 * * * *', async () => {
            console.log('editing realm points leaderboard');

            const leaderboardChannel = await client.channels.fetch(process.env.FAVOR_POINTS_LEADERBOARD_CHANNELID);
            const leaderboardMessage = await leaderboardChannel.messages.fetch(msgId);

            const { embed } = await showRealmPointsLeaderboard();
            await leaderboardMessage.edit({ embeds: [embed] });
        });
    } catch (err) {
        console.log({
            errorFrom: 'realmPointsLeaderboardScheduler',
            errorMessage: err,
        });
    }
};

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
    realmPointsLeaderboardLogic,
    realmPointsLeaderboardScheduler,
    showRealmPointsLeaderboard,
};
