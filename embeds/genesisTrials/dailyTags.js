const { EmbedBuilder } = require('discord.js');

const claimDailyTagsEmbed = new EmbedBuilder()
    .setColor(0x42ca9f)
    .setTitle('Collect your daily dose of Stella\'s Cookies!')
    .setDescription('NOTE: As the name suggests, you can only collect your daily cookies ONCE A DAY. Daily collecting **RESETS AT 12:00 GMT EVERYDAY.**')
    .setFields(
        {
            name: '__How many cookies can I collect?__',
            value: `If you are whitelisted for our Genesis Mint, you can collect **${process.env.MORE_CLAIMABLE_TAGS}** cookies daily. \n\
            If you are not whitelisted, you can still collect **${process.env.MORE_CLAIMABLE_TAGS}** if you joined before **${new Date(parseInt(process.env.JOIN_DATE_REQUIREMENT)* 1000).toUTCString()}**. \n\
            Otherwise, you can only collect **${process.env.DEFAULT_CLAIMABLE_TAGS}** cookies daily.`,
        },
        {
            name: '__What are these cookies for?__',
            value: 'You will be able to collect these cookies for a limited time during the Trial of Cookie Hoarding. \n\
            Once the Trial of Proficiency starts, you won\'t be able to earn any more cookies. \n\
            You will be able to use these cookies for the Trial of Proficiency. ',
        },
        {
            name: '__Do I need to collect my cookies? What will I get?__',
            value: 'We cannot disclaim everything right now. The anticipation will build up and you won\'t want to skip this ;)',
        },
    )
    .setImage('https://i.imgur.com/H63OH2D.png')
    .setFooter({ text: 'Collect your cookies now by pressing the button below.' });

module.exports = {
    claimDailyTagsEmbed,
};
