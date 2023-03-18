const { checkNBMonStatsModal } = require('../../../modals/genesisTrialsPt2/nbmonData');
const { getNBMonIdsOwned } = require('../../../utils/genesisTrialsPt2/nbmonData');

const nbmonDataButtonInteraction = async (interaction) => {
    try {
        switch (interaction.customId) {
            case 'checkNBMonStatsButton':
                return await interaction.showModal(checkNBMonStatsModal);
            case 'checkOwnedNBMonIdsButton':
                const { message: ownedIdsMsg } = await getNBMonIdsOwned(interaction.user.id);
                return await interaction.reply({ content: ownedIdsMsg, ephemeral: true });
        }
    } catch (err) {
        console.log({
            errorFrom: 'nbmonDataButtonInteraction',
            errorMessage: err,
        });
    }
};

module.exports = {
    nbmonDataButtonInteraction,
};
