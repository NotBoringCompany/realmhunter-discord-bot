const { checkRealmPointsCollectedEmbed } = require('../../embeds/genesisTrialsPt2/realmPoints');
const { checkRealmPointsButton } = require('../../utils/genesisTrialsPt2/realmPoints');

const showCheckRealmPointsCollectedEmbed = async (message) => {
    try {
        await message.channel.send({
            embeds: [checkRealmPointsCollectedEmbed],
            components: checkRealmPointsButton(),
        });
    } catch (err) {
        console.log({
            errorFrom: 'showCheckRealmPointsCollectedEmbed',
            errorMessage: err,
        });
    }
};

module.exports = {
    showCheckRealmPointsCollectedEmbed,
};
