const { getCurrentHunterGamesId, addParticipant } = require('../../../utils/genesisTrialsPt2/hunterGames');

const hunterGamesInteraction = async (interaction) => {
    try {
        if (interaction.customId.startsWith('joinHunterGamesButton')) {
            // get the current ID
            const currentId = await getCurrentHunterGamesId();

            if (interaction.customId === `joinHunterGamesButton${currentId}`) {
                const { message } = await addParticipant(interaction.user.id);
                return await interaction.reply({ content: message, ephemeral: true });
            } else {
                return await interaction.reply({ content: 'Cannot join non-existent or older Hunter Games.', ephemeral: true });
            }
        }
    } catch (err) {
        console.log({
            errorFrom: 'hunterGamesInteraction',
            errorMessage: err,
        });
    }
};

module.exports = {
    hunterGamesInteraction,
};
