const { retrieveUnrewardedContributionsLogic, rewardContributionLogic, invalidateContributionLogic } = require('../../utils/genesisTrials/rewardContributions');

/**
 * Calls the `retrieveUnrewardedContributionsLogic` function and retrieves a list of all contributions that have not been rewarded yet.
 */
const retrieveUnrewardedContributions = async (message) => {
    try {
        const { status, message: contributionsMessage, contributions } = await retrieveUnrewardedContributionsLogic();

        // if no contributions, we return the status and message.
        if (!contributions) {
            return {
                status: status,
                message: contributionsMessage,
            };
        // otherwise, we will loop for each contribution and return it in a message.
        } else {
            let contributionMessage = '';
            for (let i = 0; i < contributions.length; i++) {
                const contribution = contributions[i];

                if (contribution) {
                    contributionMessage += `User ID: ${contribution.userId} - ${contribution.contributionUrl}\n`;
                }

                console.log(contribution);
            }

            return {
                status: status,
                message: contributionMessage,
            };
        }
    } catch (err) {
        console.log({
            errorFrom: 'retrieveUnrewardedContributions',
            errorMessage: err,
        });
    }
};

/**
 * Calls the `invalidateContributionLogic` function and invalidates a contribution.
 */
const invalidateContribution = async (message) => {
    try {
        const [hunt, invalidateContribution, userId, ...contributionUrl] = message.content.split(' ');

        if (!contributionUrl) {
            return {
                status: 'error',
                message: 'Contribution URL is required.',
            };
        }

        if (!userId) {
            return {
                status: 'error',
                message: 'User ID is required.',
            };
        };

        return await invalidateContributionLogic(userId, contributionUrl.join(' '));
    } catch (err) {
        console.log({
            errorFrom: 'invalidateContribution',
            errorMessage: err,
        });
    }
};

/**
 * Calls the `rewardContributionLogic` function and rewards a contribution.
 */
const rewardContribution = async (message) => {
    try {
        const [hunt, rewardContribution, userId, ...contributionUrl] = message.content.split(' ');

        console.log(hunt, rewardContribution, userId, contributionUrl);

        // make sure the commands are typed properly.
        if (rewardContribution.toLowerCase() !== 'rewardcontribution') {
            return {
                status: 'error',
                message: 'Invalid command.',
            };
        }

        if (hunt !== '!hunt') {
            return {
                status: 'error',
                message: 'Invalid command. Check that you spelt !hunt correctly.',
            };
        }

        if (!userId) {
            return {
                status: 'error',
                message: 'User ID is required.',
            };
        }

        if (!contributionUrl) {
            return {
                status: 'error',
                message: 'Contribution URL is required.',
            };
        }

        return await rewardContributionLogic(userId, contributionUrl.join(' '));
    } catch (err) {
        console.log({
            errorFrom: 'rewardContribution',
            errorMessage: err,
        });
    }
};

module.exports = {
    retrieveUnrewardedContributions,
    invalidateContribution,
    rewardContribution,
};
