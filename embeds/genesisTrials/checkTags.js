const { EmbedBuilder } = require('discord.js');

const checkTagsCollectedEmbed = new EmbedBuilder()
    .setColor(0x42ca9f)
    .setTitle('Check Hunter Tags Collected')
    .setDescription('Click on the button below to check how many tags you have collected so far.');

module.exports = {
    checkTagsCollectedEmbed,
};
