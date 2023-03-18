const { purchaseSHP, purchaseXPBooster } = require('../../../utils/genesisTrialsPt2/trialsShop');

const trialsShopModalInteraction = async (interaction) => {
    try {
        if (interaction.customId === 'purchaseSHPModal') {
            const nbmonId = interaction.fields.getTextInputValue('shpNBMonId');
            const { message } = await purchaseSHP(interaction.user.id, nbmonId);

            return await interaction.reply({ content: message, ephemeral: true });
        } else if (interaction.customId === 'purchaseXPBoosterModal') {
            const nbmonId = interaction.fields.getTextInputValue('xpBoosterNBMonId');
            const { message } = await purchaseXPBooster(interaction.user.id, nbmonId);

            return await interaction.reply({ content: message, ephemeral: true });
        }
    } catch (err) {
        console.log({
            errorFrom: 'trialsShopModalInteraction',
            errorMessage: err,
        });
    }
};

module.exports = {
    trialsShopModalInteraction,
};
