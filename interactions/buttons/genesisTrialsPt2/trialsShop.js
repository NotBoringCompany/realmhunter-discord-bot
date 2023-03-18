const { purchaseSHPModal, purchaseXPBoosterModal } = require('../../../modals/genesisTrialsPt2/trialsShop');
const { purchaseCommonNBMon } = require('../../../utils/genesisTrialsPt2/trialsShop');

const trialsShopInteraction = async (interaction) => {
    try {
        switch (interaction.customId) {
            case 'purchaseSHPButton':
                return await interaction.showModal(purchaseSHPModal);
            case 'purchaseXPBoosterButton':
                return await interaction.showModal(purchaseXPBoosterModal);
            case 'purchaseCommonNBMonButton':
                const { message: commonNBMonMessage } = await purchaseCommonNBMon(interaction.user.id);
                return await interaction.reply({ content: commonNBMonMessage, ephemeral: true });
        }
    } catch (err) {
        console.log({
            errorFrom: 'trialsShopInteraction',
            errorMessage: err,
        });
    }
};

module.exports = {
    trialsShopInteraction,
};
