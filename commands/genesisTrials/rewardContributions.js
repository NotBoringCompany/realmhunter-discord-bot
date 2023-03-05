const { retrieveUnrewardedContributionsLogic, rewardContributionLogic } = require('../../utils/genesisTrials/rewardContributions');

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

                contributionMessage += `User ID: ${contribution.userId} - ${contribution.contributionUrl}\n`;

                console.log(contribution);
            }

            return {
                status: status,
                message: contributionMessage,
            };
        }
    } catch (err) {
        throw err;
    }
};

/**
 * Calls the `rewardContributionLogic` function and rewards a contribution.
 */
const rewardContribution = async (message) => {
    try {
        const [hunt, rewardContribution, userId, contributionUrl] = message.content.split(' ');

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

        return await rewardContributionLogic(userId, contributionUrl);
    } catch (err) {
        throw err;
    }
};

module.exports = {
    retrieveUnrewardedContributions,
    rewardContribution,
};
