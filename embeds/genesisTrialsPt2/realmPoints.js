const { EmbedBuilder } = require('discord.js');

const checkRealmPointsCollectedEmbed = new EmbedBuilder()
    .setColor(0x42ca9f)
    .setTitle('Check Favor Points Collected')
    .setDescription('Click on the button below to check how many Favor Points you have collected so far.');

const realmPointsLeaderboardEmbed = (leaderboard) => {
    return new EmbedBuilder()
        .setColor(0x42ca9f)
        .setTitle('Favor Points Leaderboard')
        .setFields(leaderboard)
        .setFooter({ text: 'Leaderboard is updated 10 minutes.' });
};

module.exports = {
    checkRealmPointsCollectedEmbed,
    realmPointsLeaderboardEmbed,
};
