const { manuallyRewardTagsLogic } = require('../../utils/genesisTrials/manualRewarding');

const manuallyRewardTags = async (message) => {
    try {
        const [hunt, manuallyRewardTags, toGeneralChat, userId, tagsToGive, ...reason] = message.content.split(' ');

        console.log(toGeneralChat);

        if (toGeneralChat.toLowerCase() === 'togeneralchat' || toGeneralChat.toLowerCase() === 'nottogeneralchat') {
            return await manuallyRewardTagsLogic(userId, tagsToGive, reason.join(' '));
        } else {
            return {
                status: 'error',
                message: 'Please specify whether to send the message to general chat or not.',
            };
        }
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
