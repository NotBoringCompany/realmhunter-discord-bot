const { questEntriesTagClaimButton } = require('../../utils/genesisTrials/questWinners');

const showFirstQuestWinnerButtons = async (message) => {
    try {
        await message.channel.send({
            components: [
                {
                   type: 1,
                   components: questEntriesTagClaimButton(),
                },
            ],
        });
    } catch (err) {
        console.log({
            errorFrom: 'showFirstQuestWinnerButtons',
            errorMessage: err,
        });
    }
};

module.exports = {
    showFirstQuestWinnerButtons,
};
