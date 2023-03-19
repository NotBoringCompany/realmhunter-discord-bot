const { EmbedBuilder } = require('discord.js');

const hunterGamesEmbed = (id, image) => {
    return new EmbedBuilder()
        .setColor(0x42ca9f)
        .setTitle(`Hunter Games #${id}`)
        .setImage(image)
        .setDescription(`The Hunter Games has just started. Take part, fight other citizens and win loads of Favor Points! __**${process.env.HUNTER_GAMES_ENTRANCE_FEE} COOKIES REQUIRED TO PARTICIPATE!**__`);
};

const updateHunterGamesEmbed = (time, additionalMsg) => {
    return new EmbedBuilder()
        .setColor(0x42ca9f)
        .setTitle(`Hunter Games will start in ${time} seconds. ${additionalMsg}`);
}

const hunterGamesNoParticipantsEmbed = new EmbedBuilder()
    .setColor(0x42ca9f)
    .setTitle('Hunter Games cancelled.')
    .setDescription('Not enough participants for current Hunter Games.');

const hunterGamesStartMessageEmbed = (participantCount) => {
    return new EmbedBuilder()
        .setColor(0x42ca9f)
        .setTitle('Hunter Games has started!')
        .setDescription(`${participantCount} citizens are eying the rewards really hard. Who will be on top?`);
};

const hunterGamesBattle = (round, battleMessage, participantsLeftCount) => {
    return new EmbedBuilder()
        .setColor(0x42ca9f)
        .setTitle(`Round ${round}`)
        .setDescription(`${battleMessage}`)
        .setFields(
            { name: 'Hunters left: ', value: `${participantsLeftCount}` },
        );
};

const hunterGamesFinishedEmbed = (leaderboard) => {
    return new EmbedBuilder()
        .setColor(0x42ca9f)
        .setTitle('Hunter Games has ended.')
        .setDescription('Winners: \n' + leaderboard);
};

module.exports = {
    hunterGamesEmbed,
    updateHunterGamesEmbed,
    hunterGamesNoParticipantsEmbed,
    hunterGamesStartMessageEmbed,
    hunterGamesBattle,
    hunterGamesFinishedEmbed,
};
