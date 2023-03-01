const { EmbedBuilder } = require('discord.js');

const submitContributionEmbed = new EmbedBuilder()
    .setColor(0x42ca9f)
    .setTitle('Submit your community contribution work here!')
    .setDescription('If you have created some kind of work for the Realm Hunter community (in any form), feel free to submit it here!')
    .setFields(
        {
            name: '__What kind of work can I submit?__',
            value: 'We accept any kind of work you dedicate to Realm Hunter - fanarts, threads, videos, music, anything! They all provide value to the community :)',
        },
        {
            name: '__What can I get from my work?__',
            value: 'For each work that you submit, our mods will carefully review it and check if they are relevant to Realm Hunter. \n\
            If they are, you will be rewarded with **10 Hunter Tags** once your work is approved. They will be automatically added to your account.',
        },
        {
            name: '__Can I submit multiple works daily?__',
            value: 'You can submit multiple **DIFFERENT WORKS** daily. Refrain from submitting the same work multiple times. They won\'t count. \n\
            There is also only a limit of **10 HUNTER TAGS** we can reward you daily for EACH work. For instance, if you submit 5 works, we will reward you with **10 Hunter Tags** each day for 5 days.',
        },
    );

module.exports = {
    submitContributionEmbed,
};
