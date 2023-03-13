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
            If you are a **SERVER BOOSTER**, you will get an **ADDITIONAL** vote, so you can either get three or five votes in total. \n\
            You can check how many votes you have left by clicking the 'Check votes left' button.`,
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
            name: '__**How do I check who I\'ve voted for?**__',
            value: `Click on the 'Check who I voted for' button to see who you\'ve voted for.`,
        },
        {
            name: '__**I voted for the wrong nominee or I want to change my vote. How do I do this?**__',
            value: `Click on the 'Rescind Vote' button to remove your vote from whoever you voted for. \n\
            As long as the voting period is still ongoing, you will get one vote back for every vote you rescinded. \n\
            Please note that if you voted for the same nominee multiple times, you will need to rescind the vote for that many times to completely remove your vote from that nominee. \n\
            Otherwise, it will only remove one vote from that nominee each time.`,
        },
        {
            name: '__**How will the lead and vice representatives be chosen?**__',
            value: 'The nominee with the **highest** votes will become the lead, and the nominee with the **second highest** votes will become the vice.',
        },
    );

const stakeTagsEmbed = new EmbedBuilder()
    .setColor(0x42ca9f)
    .setTitle('Stake cookies for your nation!')
    .setDescription('Click on the Stake Now button to stake.')
    .setFields(
        {
            name: '__**How many cookies can I stake?**__',
            value: 'You can stake as many cookies as you have in your inventory. Note that staking more may allow your nation to get more benefits.',
        },
        {
            name: '__**How can I unstake my cookies?**__',
            value: `You can unstake any staked cookies by clicking the 'Unstake' button.`,
        },
    );

const cumulativeNationTagsStakedEmbed = (leaderboard) => {
    return new EmbedBuilder()
        .setColor(0x42ca9f)
        .setTitle('Cumulative cookies staked per nation/union')
        .setFields(leaderboard)
        .setFooter({ text: 'Leaderboard is updated every 10 minutes.' });
};

const distributeNationPendingTagsEmbed = new EmbedBuilder()
    .setColor(0x42ca9f)
    .setTitle('Distribute earned cookies to your members!')
    .setDescription('Click on the Distribute Now button to distribute.')
    .setFields(
        {
            name: '__**How many cookies can I distribute?**__',
            value: 'You can distribute as many cookies as you want to any member. Just remember that some members may deserve more cookies.',
        },
        {
            name: '__**How can I check how many pending cookies my nation/union has?**__',
            value: `Click on the 'Check pending cookies earned' button to check.`,
        },
    );

module.exports = {
    nationRoleEmbed,
    representativeVotingEmbed,
    stakeTagsEmbed,
    cumulativeNationTagsStakedEmbed,
    distributeNationPendingTagsEmbed,
};
