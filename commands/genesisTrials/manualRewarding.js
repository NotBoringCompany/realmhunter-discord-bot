const { manuallyRewardTagsLogic } = require('../../utils/genesisTrials/manualRewarding');

const manuallyRewardTags = async (message) => {
    try {
        const [hunt, manuallyRewardTags, userId, tagsToGive, ...reason] = message.content.split(' ');

        return await manuallyRewardTagsLogic(userId, tagsToGive, reason.join(' '));
    } catch (err) {
        console.log({
            errorFrom: 'manuallyRewardTags',
            errorMessage: err,
        });
    }
};

module.exports = {
    manuallyRewardTags,
};
