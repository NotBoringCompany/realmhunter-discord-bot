const { EmbedBuilder } = require('discord.js');

const tagsLeaderboardEmbed = (leaderboard) => {
    return new EmbedBuilder()
        .setColor(0x42ca9f)
        .setTitle('Stella\'s Cookies Leaderboard')
        .setFields(leaderboard)
        .setFooter({ text: 'Leaderboard is updated every hour.' });
};

module.exports = {
    tagsLeaderboardEmbed,
};
