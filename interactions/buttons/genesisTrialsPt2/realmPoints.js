const { checkRealmPointsCollected } = require('../../../utils/genesisTrialsPt2/realmPoints');

const realmPointsButtonInteraction = async (interaction) => {
    try {
        switch (interaction.customId) {
            case 'checkRealmPointsCollectedButton':
                const { message: checkMessage } = await checkRealmPointsCollected(interaction.user.id);
                return await interaction.reply({ content: checkMessage, ephemeral: true });
        }
    } catch (err) {
        console.log({
            errorFrom: 'realmPointsButtonInteraction',
            errorMessage: err,
        });
    }
};

module.exports = {
    realmPointsButtonInteraction,
};
