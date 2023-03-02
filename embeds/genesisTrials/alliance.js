
const { EmbedBuilder } = require('discord.js');

/**
 * Shows an embed with the alliance members
 */
const showAllianceEmbed = (allianceName, membersData) => {
    return new EmbedBuilder()
        .setColor(0x42ca9f)
        .setTitle(`Alliance: ${allianceName}`)
        .setFields(membersData);
};

module.exports = {
    showAllianceEmbed,
};
