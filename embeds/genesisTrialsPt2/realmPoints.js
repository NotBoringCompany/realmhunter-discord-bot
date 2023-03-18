const { EmbedBuilder } = require('discord.js');

const checkRealmPointsCollectedEmbed = new EmbedBuilder()
    .setColor(0x42ca9f)
    .setTitle('Check Favor Points Collected')
    .setDescription('Click on the button below to check how many Favor Points you have collected so far.');

module.exports = {
    checkRealmPointsCollectedEmbed,
};
