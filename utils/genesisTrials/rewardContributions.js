require('dotenv').config();

const mongoose = require('mongoose');
const { ContributionSchema, DiscordUserSchema } = require('../schemas');

mongoose.connect(process.env.MONGODB_URI);

/**
 * Retrieves ALL submitted contributions from `submitContributions`.
 */
const retrieveSubmittedContributionsLogic = async () => {
    try {
        const Contributions = mongoose.model('ContributionData', ContributionSchema, 'RHDiscordContributionData');
        const contributionsQuery = await Contributions.find();

        // if no contributions yet, we return a message that no contributions are found.
        if (!contributionsQuery) {
            return {
                status: 'error',
                message: 'No contributions found.',
                contributions: null,
            };
        } else {
            // we retrieve all contributions from the database and map it, getting only the user ID and contributions.
            const contributionData = contributionsQuery.map(contribution => ({
                userId: contribution.userId,
                contributions: contribution.contributions,
            }));

            return {
                status: 'success',
                message: 'Contributions retrieved.',
                contributionData: contributionData,
            };
        }
    } catch (err) {
        console.log({
            errorFrom: 'retrieveSubmittedContributions',
            errorMessage: err,
        });
    }
};

/**
 * Retrieves all contributions that have not been rewarded yet and returns their URL and user ID for each.
 */
const retrieveUnrewardedContributionsLogic = async () => {
    try {
        const { contributionData } = await retrieveSubmittedContributionsLogic();

        // if no contributions yet, we return a message that no contributions are found.
        if (!contributionData) {
            return {
                status: 'error',
                message: 'No contributions found.',
                contributions: null,
            };
        } else {
            const formattedContributionData = [];
            // we filter out all contributions that have been rewarded and only return their URL and user ID.
            for (let i = 0; i < contributionData.length; i++) {
                const userId = contributionData[i].userId;
                const contribution = contributionData[i].contributions[0];

                if (!contribution.rewarded) {
                    formattedContributionData.push({
                        userId: userId,
                        contributionUrl: contribution.url,
                    });
                }
            }

            return {
                status: 'success',
                message: 'Unrewarded contributions retrieved.',
                contributions: formattedContributionData,
            };
        }
    } catch (err) {
        throw err;
    }
};

/**
 * Called when a contribution is deemed invalid for rewards. Will get deleted from the database.
 */
const invalidateContributionLogic = async (userId, url) => {
    try {
        const Contributions = mongoose.model('ContributionData', ContributionSchema, 'RHDiscordContributionData');
        const contributionsQuery = await Contributions.findOne({ userId: userId });

        // if query is empty, then the user does not have any contributions.
        if (!contributionsQuery) {
            return {
                status: 'error',
                message: 'No contributions from this user ID found.',
            };
        // otherwise, we first find the contribution that matches the url and delete it.
        } else {
            // find the contribution.
            const contribution = contributionsQuery.contributions.find(contribution => contribution.url === url);

            // if the contribution is not found, we return an error message.
            if (!contribution) {
                return {
                    status: 'error',
                    message: 'No contribution found with this URL.',
                };
            // if contribution is found, we delete it.
            } else {
                // delete the contribution.
                contributionsQuery.contributions.pull(contribution);
                await contributionsQuery.save();

                return {
                    status: 'success',
                    message: 'Contribution invalidated and deleted.',
                };
            }
        }
    } catch (err) {
        throw err;
    }
};
/**
 * Rewards a user for their contribution. Gifts them 10 tags, marks their contribution as rewarded and sets `dailyContributionTagsClaimed` to true.
 */
const rewardContributionLogic = async (userId, url) => {
    try {
        const Contributions = mongoose.model('ContributionData', ContributionSchema, 'RHDiscordContributionData');
        const contributionsQuery = await Contributions.findOne({ userId: userId });

        // if no contribution yet, we return a message that no contributions are found.
        if (!contributionsQuery) {
            console.log('not found');
            return {
                status: 'error',
                message: 'No contributions from this user ID found.',
            };
        // if query is found, then we will first match the URL to the contribution URL.
        } else {
            // return the contribution that matches the URL
            const contribution = contributionsQuery.contributions.find(contribution => contribution.url === url);

            // if the contribution with the URL is found, we return an error message.
            if (!contribution) {
                return {
                    status: 'error',
                    message: 'No contribution found with this URL.',
                };
            }

            // we check if the contribution has already been rewarded.
            const isRewarded = contribution.rewarded;

            // if the contribution has already been rewarded, we return a message that the contribution has already been rewarded.
            if (isRewarded) {
                return {
                    status: 'error',
                    message: 'This contribution has already been rewarded.',
                };
            // otherwise, we will (if the user has not already been rewarded):
            // 1. reward the user with 10 tags
            // 2. mark the contribution as rewarded
            // 3. set `dailyContributionTagsClaimed` to true
            } else {
                // first, we check if the user has received their daily contribution tags.
                const User = mongoose.model('User', DiscordUserSchema, 'RHDiscordUserData');
                const userQuery = await User.findOne({ userId: userId });

                // if user isn't found, something is wrong.
                // at this point, when they submit a contribution, they should already be in the database.
                // we request them to submit a ticket.
                if (!userQuery) {
                    return {
                        status: 'error',
                        message: 'Something went wrong. Please submit a ticket.',
                    };
                // if user is found, we first check if `dailyContributionTagsClaimed` is true.
                } else {
                    const dailyContributionTagsClaimed = userQuery.dailyContributionTagsClaimed;

                    // if they haven't claimed, then we will:
                    // 1. mark the contribution as rewarded
                    // 2. reward the user with 10 tags
                    // 3. set `dailyContributionTagsClaimed` to true
                    if (!dailyContributionTagsClaimed) {
                        // we update the contribution to be marked as rewarded.
                        await Contributions.updateOne({ userId: userId, 'contributions.url': url }, { $set: { 'contributions.$.rewarded': true } });

                        userQuery.hunterTags += 10;
                        userQuery.dailyContributionTagsClaimed = true;

                        await userQuery.save();

                        return {
                            status: 'success',
                            message: `<@${userId}> has been rewarded 10 cookies for their contribution: ${url}`,
                        };
                    // if they have already claimed their contribution rewards for the day, we return a message that they have already claimed their rewards.
                    } else {
                        return {
                            status: 'error',
                            message: 'User has already claimed their contribution rewards for the day. Wait until tomorrow to claim again.',
                        };
                    }
                }
            }
        }
    } catch (err) {
        throw err;
    }
};

module.exports = {
    retrieveSubmittedContributionsLogic,
    retrieveUnrewardedContributionsLogic,
    invalidateContributionLogic,
    rewardContributionLogic,
};

