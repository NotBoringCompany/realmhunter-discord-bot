const { EmbedBuilder } = require('discord.js');

const randomTagAppearanceEmbed = new EmbedBuilder()
    .setColor(0x42ca9f)
    .setTitle('Stella\'s Cookies up for grabs!')
    .setDescription('Stella has dropped 5 cookies while making a huge batch! Quick, collect them now by typing __**!hunt collectCookies**__ in the chat. \n\
    First candidate to collect them will get all 5 cookies.',
    )
    .setImage('https://i.imgur.com/HkPn7je.png');

module.exports = {
    randomTagAppearanceEmbed,
};
