const { EmbedBuilder } = require('discord.js');

const roleNotifEmbed = new EmbedBuilder()
    .setColor(0x42ca9f)
    .setTitle('Get Your Notification Roles!')
    .setDescription('Click on the buttons below to get the corresponding notification roles.');

module.exports = {
    roleNotifEmbed,
};
