const { attackBossModal } = require('../../../modals/genesisTrialsPt2/nbmonDungeon');
const { getLatestBossId, getOwnedNBMonIds, userLastHit } = require('../../../utils/genesisTrialsPt2/nbmonDungeon');

const attackBossInteraction = async (interaction) => {
    try {
        const currentBossId = await getLatestBossId();
        switch (interaction.customId) {
            case `attackBossButton${currentBossId}`:
                // checks if the user owns at least one NBMon, else throw error.
                const ownsAtLeastOne = await getOwnedNBMonIds(interaction.user.id);
                if (ownsAtLeastOne === 'No NBMons owned. Capture or buy some from the shop.') {
                    return await interaction.reply({ content: ownsAtLeastOne, ephemeral: true });
                }

                // check if user has already attacked the past 5 minutes.
                const { status: lastHitStatus, message: lastHitTimestamp } = await userLastHit(interaction.user.id);

                if (lastHitStatus === 'error') {
                    return await interaction.reply({ content: lastHitTimestamp, ephemeral: true });
                }

                return await interaction.showModal(attackBossModal);
            case 'checkNBMonsOwnedButton':
                const nbmonsOwned = await getOwnedNBMonIds(interaction.user.id);
                return await interaction.reply({ content: `You own the following NBMon IDs: ${nbmonsOwned}`, ephemeral: true });
        }
    } catch (err) {
        console.log({
            errorFrom: 'attackBossInteraction',
            errorMessage: err,
        });
    }
};

module.exports = {
    attackBossInteraction,
};
