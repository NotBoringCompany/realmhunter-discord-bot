const { EmbedBuilder } = require('discord.js');

const claimDailyTagsEmbed = new EmbedBuilder()
    .setColor(0x42ca9f)
    .setTitle('Claim your daily Hunter Tags!')
    .setDescription('NOTE: As the name suggests, you can only claim your daily tags ONCE A DAY. Daily claiming **RESETS AT 12:00 GMT EVERYDAY.**')
    .setFields(
        {
            name: '__How many tags can I claim?__',
            value: `If you are whitelisted for our Genesis Mint, you can claim **${process.env.MORE_CLAIMABLE_TAGS}** tags daily. \n\
            If you are not whitelisted, you can still claim **${process.env.MORE_CLAIMABLE_TAGS}** if you joined before **${new Date(parseInt(process.env.JOIN_DATE_REQUIREMENT)* 1000).toUTCString()}**. \n\
            Otherwise, you can only claim **${process.env.DEFAULT_CLAIMABLE_TAGS}** tags daily.`,
        },
        {
            name: '__What are these tags for?__',
            value: 'You will be able to collect these tags for a limited time during the Trial of Tag Hoarding. \n\
            Once the Trial of Proficiency starts, you won\'t be able to earn any more tags. \n\
            You will be able to use these tags for the Trial of Proficiency. ',
        },
        {
            name: '__Do I need to claim my tags? What will I get?__',
            value: 'We cannot disclaim everything right now. The anticipation will build up and you won\'t want to skip this.',
        },
    )
    .setFooter({ text: 'Claim your tags now by pressing the button below.' });

module.exports = {
    claimDailyTagsEmbed,
};
