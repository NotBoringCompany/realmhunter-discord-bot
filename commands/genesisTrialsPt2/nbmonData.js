const { nbmonDataEmbed, checkNBMonsOwnedEmbed } = require("../../embeds/genesisTrialsPt2/nbmonData");
const { ownedNBMonEmbedButtons } = require("../../utils/genesisTrialsPt2/nbmonData");

const showNBMonDataEmbed = async (message) => {
    try {
        await message.channel.send({
            embeds: [checkNBMonsOwnedEmbed],
            components: [
                {
                    type: 1,
                    components: ownedNBMonEmbedButtons(),
                },
            ],
        });
    } catch (err) {
        console.log({
            errorFrom: 'showNBMonDataEmbed',
            errorMessage: err,
        });
    }
};

module.exports = {
    showNBMonDataEmbed,
};