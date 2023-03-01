const { EmbedBuilder } = require('discord.js');

const randomTagAppearanceEmbed = new EmbedBuilder()
    .setColor(0x42ca9f)
    .setTitle('Hunter Tags up for grabs!')
    .setDescription('5 Hunter Tags have been summoned! Claim them now by typing __**!hunt claimTags**__ in the chat. \n\
    First candidate to claim them will get all 5 tags.',
    );

module.exports = {
    randomTagAppearanceEmbed,
};
