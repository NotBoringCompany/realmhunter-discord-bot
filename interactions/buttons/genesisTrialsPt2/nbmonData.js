const { disownNBMonModal } = require('../../../modals/genesisTrialsPt2/nbmonData');
const { checkNBMonStatsModal, updateNBMonNameModal } = require('../../../modals/genesisTrialsPt2/nbmonData');
const { getNBMonIdsOwned } = require('../../../utils/genesisTrialsPt2/nbmonData');

const nbmonDataButtonInteraction = async (interaction) => {
    try {
        switch (interaction.customId) {
            case 'checkNBMonStatsButton':
                return await interaction.showModal(checkNBMonStatsModal);
            case 'checkOwnedNBMonIdsButton':
                const { message: ownedIdsMsg } = await getNBMonIdsOwned(interaction.user.id);
                return await interaction.reply({ content: ownedIdsMsg, ephemeral: true });
            case 'changeNBMonNameButton':
                return await interaction.showModal(updateNBMonNameModal);
            case 'disownNBMonButton':
                return await interaction.showModal(disownNBMonModal);
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
