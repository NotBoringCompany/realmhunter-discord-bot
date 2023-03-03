const { EmbedBuilder } = require('discord.js');

const PartOneInfoEmbed = new EmbedBuilder()
    .setColor(0x42ca9f)
    .setTitle('Genesis Trials Part 1: The Trial of Cookie Hoarding')
    .setDescription('Welcome to the first part of the Genesis Trials! In this part, you will be competing against other citizens to obtain the most cookies from Stella. This trial will last until <t:1678446000:F> before Part 2 starts.')
    .setFields(
        {
            name: '__**How can I collect cookies?**__',
            value: `1. Collecting your daily dose of cookies in <#${process.env.CLAIM_DAILY_COOKIES_CHANNELID}>. \n\
            2. Stella will randomly drop cookies at a random minute **EACH HOUR** (i.e. 24 times a day) in <#${process.env.GENERAL_CHAT_CHANNELID}>. First citizen to claim them will collect all the cookies. Pay attention and keep an eye on the general chat! \n\
            3. Participating in our quests/campaigns via the <#${process.env.QUESTS_CHANNELID}> channel.
            4. Submitting contributions and earning up to 10 cookies a day when approved in <#${process.env.SUBMIT_CONTRIBUTIONS_CHANNELID}>.`,
        },
        {
            name: '__**What other activities can I do in the meantime during the Trial of Cookie Hoarding?**__',
            value: `1. You can create an alliance with other citizens and become the ultimate alliance. Visit <#${process.env.ALLIANCE_HELP_CHANNELID}> for more info. \n\
            2. Get special notification roles via the <#${process.env.ROLE_NOTIF_CHANNELID}> channel. \n\
            `,
        },
    );


module.exports = {
    PartOneInfoEmbed,
};
