require('dotenv').config();
const mongoose = require('mongoose');
const { tagsLeaderboardEmbed } = require('../../embeds/genesisTrials/tagsLeaderboard');
const { DiscordUserSchema } = require('../schemas');
const cron = require('node-cron');

// get the current tags leaderboard.
const tagsLeaderboardLogic = async (client) => {
    try {
        // we query the users database and get their userId and tags collected so far.
        const User = mongoose.model('UserData', DiscordUserSchema, 'RHDiscordUserData');
        // sort by hunterTags in descending order and limit to 25 users (limit for amount of fields on a discord embed.)
        const userQuery = await User.find({}).sort({ hunterTags: -1 }).limit(25);

        // if no users yet, we return an empty embed.
        if (!userQuery) {
            return {
                embed: tagsLeaderboardEmbed(
                    [{
                    name: 'Leaderboard',
                    value: 'No users yet.',
                }]),
                status: 'success',
                message: 'No users yet.',
            };
        // if there are users, we return the leaderboard.
        } else {
            // we create an array of objects with the userId and tags collected.
            const leaderboard = [];
            for (let i = 0; i < userQuery.length; i++) {
                const user = userQuery[i];

                const userId = user.userId;

                // get the user's username
                const userData = await client.users.fetch(userId);
                const userTag = userData.username + '#' + userData.discriminator;

                leaderboard.push({
                    name: `${i + 1}. ${userTag}`,
                    value: `${user.hunterTags} cookies`,
                });
            }

            return {
                embed: tagsLeaderboardEmbed(leaderboard),
                status: 'success',
                message: 'Successfully retrieved the leaderboard.',
            };
        }
    } catch (err) {
        console.log({
            errorFrom: 'tagsLeaderboardLogic',
            errorMessage: err,
        });
    }
};

/**
 * Show the leaderboard embed.
 */
const showTagsLeaderboard = async (client) => {
    try {
        return await tagsLeaderboardLogic(client);
    } catch (err) {
        throw err;
    }
};

/**
 * Scheduled to edit the tags leaderboard every hour.
 */
const tagsLeaderboardScheduler = async (msgId, client) => {
    try {
        cron.schedule('0 0 * * * *', async () => {
            console.log('editing leaderboard.');

            const leaderboardChannel = await client.channels.fetch(process.env.COOKIES_LEADERBOARD_CHANNELID);
            const leaderboardMsg = await leaderboardChannel.messages.fetch(msgId);

            const { embed } = await showTagsLeaderboard(client);
            await leaderboardMsg.edit({ embeds: [embed] });
        });
    } catch (err) {
        throw err;
    }
};

module.exports = {
    tagsLeaderboardLogic,
    showTagsLeaderboard,
    tagsLeaderboardScheduler,
};
