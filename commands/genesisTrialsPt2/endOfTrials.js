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

const deductRealmPointsCommand = async (message) => {
    try {
        const [hunt, deductRealmPoints, userId, realmPoints] = message.content.split(' ');

        if (!userId) {
            return {
                status: 'error',
                message: 'Please provide a user ID.',
            };
        }

        if (isNaN(realmPoints) || (!realmPoints)) {
            return {
                status: 'error',
                message: 'Please provide a valid number of Realm Points to deduct.',
            };
        }

        return await deductRealmPoints(userId, realmPoints);
    } catch (err) {
        console.log({
            errorFrom: 'deductRealmPointsCommand',
            errorMessage: err,
        });
    }
};

module.exports = {
    showTradeNBMonsEmbed,
    deductRealmPointsCommand,
};
