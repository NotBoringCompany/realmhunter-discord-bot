const { tradeNBMonEmbed } = require('../../embeds/genesisTrialsPt2/endOfTrials');
const { tradeNBMonButtons } = require('../../utils/genesisTrialsPt2/endOfTrials');

const showTradeNBMonsEmbed = async (message) => {
    try {
        await message.channel.send({
            embeds: [tradeNBMonEmbed],
            components: [
                {
                    type: 1,
                    components: tradeNBMonButtons(),
                },
            ],
        });
    } catch (err) {
        console.log({
            errorFrom: 'showTradeNBMonsEmbed',
            errorMessage: err,
        });
    }
};

module.exports = {
    showTradeNBMonsEmbed,
};
