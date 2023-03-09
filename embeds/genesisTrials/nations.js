const { EmbedBuilder } = require('discord.js');

const nationRoleEmbed = new EmbedBuilder()
    .setColor(0x42ca9f)
    .setTitle('Nation Roles')
    .setDescription('Click on one of the buttons below to get the corresponding nation role.')
    .setFields(
        {
            name: 'Only **ONE** Nation role at a time!',
            value: 'Please note that you can only have one nation role at a time. \n\
            If you choose another nation role, your previous nation role will be removed and updated with the new one.',
        },
        {
            name: 'Time Limit',
            value: 'There\'s no time limit for choosing a nation, but they will be temporarily locked before the start of the Nations Events.\n\
            You will then have to represent that nation for the rest of the Trials. An announcement regarding this will be available.',
        },
    );

const representativeVotingEmbed = new EmbedBuilder()
        .setColor(0x42ca9f)
        .setTitle('Vote for your nation\'s lead and vice representatives!')
        .setDescription('Click on the Vote Now button to vote.')
        .setFields(
            {
                name: '__**How many votes can I cast?**__',
                value: `Regular citizens can cast a total of **TWO** votes.
                If you have a **Genesis Pass Whitelist** role OR joined before **${new Date(parseInt(process.env.JOIN_DATE_REQUIREMENT)* 1000).toUTCString()}**, you can cast a total of **FOUR** votes.\n\
                If you are a **SERVER BOOSTER**, you will get an **ADDITIONAL** vote, so you can either get three or five votes in total.`,
            },
            {
                name: '__**Can I vote for another nation\'s lead or vice representative?**__',
                value: 'No. It will only allow you to vote for one of your nation\'s members.',
            },
            {
                name: '__**Can I vote for myself?**__',
                value: 'Yes. You can vote for yourself if you want to. But bear in mind you will carry a lot of responsibility that other members will expect you to be able to handle.',
            },
            {
                name: '__**How do I vote for a nominee?**__',
                value: 'You need to provide the nominee\'s User ID. If you are unsure how to get the ID, please check the following link: \n\
                https://support.discord.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID-#:~:text=In%20the%20right-click%20menu,You%27re%20all%20set! \n\
                Do NOT mention or include the nominee\'s tag, otherwise the vote will not be counted.',
            },
            {
                name: '__**Can I spend multiple or all of my votes on a single nominee?**__',
                value: 'Each vote can be spent on the same nominee to increase the amount of votes they have, or it can be spent on different nominees. \n\
                It\'s completely up to you.',
            },
            {
                name: '__**I voted for the wrong nominee or I want to change my vote. How do I do this?**__',
                value: 'Click on the Rescind Vote button to remove your vote from whoever you voted for. \n\
                As long as the voting period is still ongoing, you will get one vote back for every vote you rescinded.',
            },
            {
                name: '__**How will the lead and vice representatives be chosen?**__',
                value: 'The nominee with the **highest** votes will become the lead, and the nominee with the **second highest** votes will become the vice.',
            },
        );
module.exports = {
    nationRoleEmbed,
    representativeVotingEmbed,
};
