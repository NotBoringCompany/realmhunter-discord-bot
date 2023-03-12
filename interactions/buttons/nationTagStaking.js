const { unstakeTagsModal, stakeTagsModal } = require('../../modals/nations');
const { getCurrentTagsStaked } = require('../../utils/genesisTrials/nations');

const nationTagStakingInteraction = async (interaction) => {
    try {
        switch (interaction.customId) {
            case 'stakeNationTagsButton':
                await interaction.showModal(stakeTagsModal);
                return;
            case 'unstakeNationTagsButton':
                await interaction.showModal(unstakeTagsModal);
                return;
            case 'checkStakedNationTagsButton':
                const { message: checkStakedTagsMsg } = await getCurrentTagsStaked(interaction.user.id);
                return await interaction.reply({ content: checkStakedTagsMsg, ephemeral: true });
        }
    } catch (err) {
        console.log({
            errorFrom: 'nationTagStakingInteraction',
            errorMessage: err,
        });
    };
};

module.exports = {
    nationTagStakingInteraction,
};
