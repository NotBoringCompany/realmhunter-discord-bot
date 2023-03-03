const { EmbedBuilder } = require('discord.js');

const checkTagsCollectedEmbed = new EmbedBuilder()
    .setColor(0x42ca9f)
    .setTitle('Check Stella\'s Cookies Collected')
    .setDescription('Click on the button below to check how many of Stella\'s Cookies you have collected so far.');

module.exports = {
    checkTagsCollectedEmbed,
};
