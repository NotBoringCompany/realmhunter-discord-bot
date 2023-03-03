const { PartOneInfoEmbed } = require('../../embeds/genesisTrials/helpinfo');

/**
 * Shows the part one info embed.
 */
const showPartOneInfoEmbed = async (message) => {
    try {
        await message.channel.send({
            embeds: [PartOneInfoEmbed],
        });
    } catch (err) {
        console.log({
            errorFrom: 'showPartOneInfoEmbed',
            errorMessage: err,
        });
    }
};

module.exports = {
    showPartOneInfoEmbed,
};
