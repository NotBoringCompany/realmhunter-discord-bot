const { tradeNBMonModal } = require('../../../modals/genesisTrialsPt2/endOfTrials');

const endOfTrialsInteraction = async (interaction) => {
    try {
        if (interaction.customId === 'tradeNBMonButton') {
            return await interaction.showModal(tradeNBMonModal);
        }
    } catch (err) {
        console.log({
            errorFrom: 'endOfTrialsInteraction',
            errorMessage: err,
        });
    }
};

module.exports = {
    endOfTrialsInteraction,
};
