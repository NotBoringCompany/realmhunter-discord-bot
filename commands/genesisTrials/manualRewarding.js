const { manuallyRewardTagsLogic } = require('../../utils/genesisTrials/manualRewarding');

const manuallyRewardTags = async (message) => {
    try {
        const [hunt, manuallyRewardTags, toGeneralChat, userId, tagsToGive, ...reason] = message.content.split(' ');

        if (toGeneralChat !== 'toGeneralChat' || toGeneralChat !== 'notToGeneralChat') {
            return await message.reply('Please specify if you want to send the message to the general chat or not.');
        }

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
