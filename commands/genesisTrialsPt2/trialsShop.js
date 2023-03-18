const { trialsShopEmbed } = require('../../embeds/genesisTrialsPt2/trialsShop');
const { trialsShopButtons } = require('../../utils/genesisTrialsPt2/trialsShop');

const showTrialsShopEmbed = async (message) => {
    try {
        await message.channel.send({
            embeds: [trialsShopEmbed],
            components: [
                {
                    type: 1,
                    components: trialsShopButtons(),
                },
            ],
        });
    } catch (err) {
        console.log({
            errorFrom: 'showTrialsShopEmbed',
            errorMessage: err,
        });
    }
};

module.exports = {
    showTrialsShopEmbed,
};
