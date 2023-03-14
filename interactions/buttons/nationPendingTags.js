const { distributeNationPendingTagsModal } = require('../../modals/nations');
const { checkNationPendingTags, getAllNationMembersStakingLogic } = require('../../utils/genesisTrials/nations');

const nationPendingTagsDistribution = async (interaction) => {
    try {
        if (interaction.customId === 'distributeNationPendingTagsButton') {
            return await interaction.showModal(distributeNationPendingTagsModal);
        } else if (interaction.customId === 'checkNationPendingTagsButton') {
            const { message } = await checkNationPendingTags(interaction);
            return await interaction.reply({ content: message, ephemeral: true });
        } else if (interaction.customId === 'checkNationMembersStakeAmountButton') {
            const { status, message, stakedData } = await getAllNationMembersStakingLogic(interaction);
            if (status === 'error') {
                return await interaction.reply({ content: message, ephemeral: true });
            } else {
                return await interaction.reply({ content: stakedData, ephemeral: true });
            }
        }
    } catch (err) {
        console.log({
            errorFrom: 'nationPendingTagsDistribution',
            errorMessage: err,
        });
    }
};

module.exports = {
    nationPendingTagsDistribution,
};
