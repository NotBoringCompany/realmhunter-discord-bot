const { EmbedBuilder } = require('discord.js');

const trialsShopEmbed = new EmbedBuilder()
    .setColor(0x42ca9f)
    .setTitle('Trials Shop')
    .setDescription('Purchase items from the Trials Shop with your cookies. The image above shows the description of each item.');

module.exports = {
    trialsShopEmbed,
};
