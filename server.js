require('dotenv').config();
const fs = require('fs');
const path = require('path');

const { Client, GatewayIntentBits, Collection, InteractionType } = require('discord.js');
const Moralis = require('moralis-v1/node');
const { showSubmitContributionEmbed } = require('./commands/genesisTrials/submitContribution');
const { submitContributionModal } = require('./modals/submitContribution');
const { submitContributionToDB } = require('./utils/genesisTrials/submitContribution');
const mongoose = require('mongoose');
const { distributeTags, nextTagDistributionScheduler, distributeTagScheduler, claimRandomTags, updateTagsClaimed } = require('./utils/genesisTrials/randomTagAppearance');
const cron = require('node-cron');
const { showClaimDailyTagsEmbed, claimDailyTags } = require('./commands/genesisTrials/dailyTags');
const { restartDailyTagsAllowance } = require('./utils/genesisTrials/dailyTags');
const { checkTagsCollected } = require('./utils/genesisTrials/checkTags');
const { showCheckTagsCollected, showCheckTagsCollectedEmbed } = require('./commands/genesisTrials/checkTags');
const { showRoleNotifEmbed } = require('./commands/roleNotif');
const { giveRole } = require('./utils/discord/roleNotif');
const { 
    createAlliance,
    disbandAlliance,
    leaveAlliance,
    delegateChiefRole,
    showAlliance,
    kickFromAlliance,
    pendingAllianceInvite,
    acceptAllianceInvite,
    declineAllianceInvite,
    rescindAllianceInvite,
    showInviterPendingInvites,
    showInviteePendingInvites,
    showOwnAlliance 
} = require('./commands/genesisTrials/alliance');
const { showInviterPendingInvitesLogic, removeExpiredInvitesScheduler } = require('./utils/genesisTrials/alliance');
const { showTagsLeaderboard, tagsLeaderboardScheduler } = require('./utils/genesisTrials/tagsLeaderboard');
const { showPartOneInfoEmbed } = require('./commands/genesisTrials/helpinfo');
const { retrieveUnrewardedContributions, rewardContribution } = require('./commands/genesisTrials/rewardContributions');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessageReactions,
    ],
});

// LOADING SLASH COMMANDS
client.commands = new Collection();

const commandsPath = path.join(__dirname, 'slash-commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    // set a new item in the collection with the key as the command name and the value as the exported module
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing the required 'data' and/or 'execute' properties.`);
    }
}

// MESSAGE CREATE EVENT LISTENER
client.on('messageCreate', async (message) => {
    if (message.content.toLowerCase() === '!hunt unrewardedcontributions') {
        if (!message.member._roles.includes(process.env.CREATORS_ROLEID)) return;
        const { status, message: contributionsMessage } = await retrieveUnrewardedContributions(message).catch((err) => console.log(err));

        await message.channel.send(contributionsMessage);
    }

    if (message.content.toLowerCase().startsWith('!hunt rewardcontribution')) {
        if (!message.member._roles.includes(process.env.CREATORS_ROLEID)) return;
        const { status, message: contributionsMessage } = await rewardContribution(message).catch((err) => console.log(err));

        await message.channel.send(contributionsMessage);
    }
    // if (message.content.toLowerCase() === '!testbothere') {
    //     if (!message.member._roles.includes(process.env.CREATORS_ROLEID)) return;
    //     await message.channel.send('I\'m here!');
    // }

    // if (message.content.toLowerCase() === '!showdailytagclaim') {
    //     if (!message.member._roles.includes(process.env.CREATORS_ROLEID)) return;
    //     await showClaimDailyTagsEmbed(message).catch((err) => console.log(err));
    // }

    // if (message.content.toLowerCase() === '!showcontributionembed') {
    //     if (!message.member._roles.includes(process.env.CREATORS_ROLEID)) return;
    //     await showSubmitContributionEmbed(message).catch((err) => console.log(err));
    // }

    // if (message.content.toLowerCase() === '!showchecktagscollected') {
    //     if (!message.member._roles.includes(process.env.CREATORS_ROLEID)) return;
    //     await showCheckTagsCollectedEmbed(message).catch((err) => console.log(err));
    // }

    // if (message.content.toLowerCase() === '!showtagsleaderboard') {
    //     if (!message.member._roles.includes(process.env.CREATORS_ROLEID)) return;
    //     const { embed } = await showTagsLeaderboard(client).catch((err) => console.log(err));
    //     await message.channel.send({ embeds: [embed] });
    // }

    // if (message.content.toLowerCase() === '!showrolenotifembed') {
    //     if (!message.member._roles.includes(process.env.CREATORS_ROLEID)) return;
    //     await showRoleNotifEmbed(message).catch((err) => console.log(err));
    // }

    // if (message.content.toLowerCase() === '!showgenesistrialspartoneembed') {
    //     if (!message.member._roles.includes(process.env.CREATORS_ROLEID)) return;
    //     await showPartOneInfoEmbed(message).catch((err) => console.log(err));
    // }

    // if (message.content.toLowerCase() === '!hunt collectcookies') {
    //     if (message.channelId !== process.env.GENERAL_CHAT_CHANNELID) return;
    //     const { message: claimMessage } = await updateTagsClaimed(message).catch((err) => console.log(err));
    //     await message.channel.send(claimMessage);
    // }

    // if (message.content.toLowerCase().startsWith('!hunt createalliance')) {
    //     if (message.channelId !== process.env.ALLIANCE_BUILDING_CHANNELID) return;
    //     const { message: allianceMessage } = await createAlliance(message).catch((err) => console.log(err));
    //     await message.channel.send(allianceMessage);
    // }

    // if (message.content.toLowerCase().startsWith('!hunt invitetoalliance')) {
    //     if (message.channelId !== process.env.ALLIANCE_INVITES_CHANNELID) return;
    //     const { message: allianceMessage } = await pendingAllianceInvite(message).catch((err) => console.log(err));
    //     await message.channel.send(allianceMessage);
    // }

    // if (message.content.toLowerCase().startsWith('!hunt showsentallianceinvites')) {
    //     if (message.channelId !== process.env.ALLIANCE_INVITES_CHANNELID) return;
    //     const { embed, message: allianceMessage } = await showInviterPendingInvites(client, message).catch((err) => console.log(err));
    //     if (embed !== 'none') {
    //         await message.channel.send({ embeds: [embed] });
    //     } else {
    //         await message.channel.send(allianceMessage);
    //     }
    // }

    // if (message.content.toLowerCase().startsWith('!hunt getallianceinvites')) {
    //     if (message.channelId !== process.env.ALLIANCE_INVITES_CHANNELID) return;
    //     const { embed } = await showInviteePendingInvites(client, message).catch((err) => console.log(err));

    //     await message.channel.send({ embeds: [embed] });
    // }

    // if (message.content.toLowerCase().startsWith('!hunt rescindallianceinvite')) {
    //     if (message.channelId !== process.env.ALLIANCE_INVITES_CHANNELID) return;
    //     const { message: allianceMessage } = await rescindAllianceInvite(message).catch((err) => console.log(err));
    //     await message.channel.send(allianceMessage);
    // }

    // if (message.content.toLowerCase().startsWith('!hunt acceptallianceinvite')) {
    //     if (message.channelId !== process.env.ALLIANCE_INVITES_CHANNELID) return;
    //     const { message: allianceMessage } = await acceptAllianceInvite(message).catch((err) => console.log(err));
    //     await message.channel.send(allianceMessage);
    // }

    // if (message.content.toLowerCase().startsWith('!hunt declineallianceinvite')) {
    //     if (message.channelId !== process.env.ALLIANCE_INVITES_CHANNELID) return;
    //     const { message: allianceMessage } = await declineAllianceInvite(message).catch((err) => console.log(err));
    //     await message.channel.send(allianceMessage);
    // }

    // if (message.content.toLowerCase().startsWith('!hunt disbandalliance')) {
    //     if (message.channelId !== process.env.ALLIANCE_BUILDING_CHANNELID) return;
    //     const { message: allianceMessage } = await disbandAlliance(message).catch((err) => console.log(err));
    //     await message.channel.send(allianceMessage);
    // }

    // if (message.content.toLowerCase().startsWith('!hunt leavealliance')) {
    //     if (message.channelId !== process.env.ALLIANCE_BUILDING_CHANNELID) return;
    //     const { message: allianceMessage } = await leaveAlliance(message).catch((err) => console.log(err));
    //     await message.channel.send(allianceMessage);
    // }

    // if (message.content.toLowerCase().startsWith('!hunt delegatechiefrole')) {
    //     if (message.channelId !== process.env.ALLIANCE_BUILDING_CHANNELID) return;
    //     const { message: allianceMessage } = await delegateChiefRole(message).catch((err) => console.log(err));
    //     await message.channel.send(allianceMessage);
    // }

    // if (message.content.toLowerCase().startsWith('!hunt showalliance')) {
    //     if (message.channelId !== process.env.ALLIANCE_INFO_CHANNELID) return;
    //     const { embed, status, message: allianceMessage } = await showAlliance(client, message).catch((err) => console.log(err));
    //     if (embed !== 'none') {
    //         await message.channel.send({ embeds: [embed] });
    //     } else {
    //         await message.channel.send(allianceMessage);
    //     }
    // }

    // if (message.content.toLowerCase().startsWith('!hunt showownalliance')) {
    //     if (message.channelId !== process.env.ALLIANCE_INFO_CHANNELID) return;
    //     const { embed, status, message: allianceMessage } = await showOwnAlliance(client, message).catch((err) => console.log(err));
    //     if (embed !== 'none') {
    //         await message.channel.send({ embeds: [embed] });
    //     } else {
    //         await message.channel.send(allianceMessage);
    //     }
    // }

    // if (message.content.toLowerCase().startsWith('!hunt kickfromalliance')) {
    //     if (message.channelId !== process.env.ALLIANCE_BUILDING_CHANNELID) return;
    //     const { message: allianceMessage } = await kickFromAlliance(message).catch((err) => console.log(err));
    //     await message.channel.send(allianceMessage);
    // }
});

// INTERACTION CREATE EVENT LISTENER
client.on('interactionCreate', async (interaction) => {
    // // button interactions
    // if (interaction.isButton()) {
    //     // when claim daily tags button is clicked. will run the `claimDailyTags` function to check if the user can claim their daily tags.
    //     if (interaction.customId === 'claimDailyTagsButton') {
    //         const { message } = await claimDailyTags(interaction);
    //         await interaction.reply({ content: message, ephemeral: true });
    //     }

    //     // when submit contribution button is clicked. will show the modal for submitting a contribution.
    //     if (interaction.customId === 'submitContributionButton') {
    //         await interaction.showModal(submitContributionModal);
    //     }

    //     // when check tags collected button is clicked. will show the user how many tags they have collected.
    //     if (interaction.customId === 'checkTagsCollectedButton') {
    //         const { message } = await checkTagsCollected(interaction.user.id);
    //         await interaction.reply({ content: message, ephemeral: true });
    //     }

    //     // when founder tweet notif gang button is clicked. will give them the founder tweet notif gang role.
    //     if (interaction.customId === 'founderTweetNotifGangButton') {
    //         const { message } = await giveRole(interaction, 'founderTweetNotifGang');
    //         await interaction.reply({ content: message, ephemeral: true });
    //     }

    //     if (interaction.customId === 'dailyTagsResetNotifButton') {
    //         const { message } = await giveRole(interaction, 'dailyTagsResetNotif');
    //         await interaction.reply({ content: message, ephemeral: true });
    //     }
    // }

    // // modal submit interactions
    // if (interaction.type === InteractionType.ModalSubmit) {
    //     // if a user submits a contribution, we run the `submitContributionToDB` function to upload the contribution to the database.
    //     if (interaction.customId === 'submitContributionModal') {
    //         // get the user id and the contribution work url from the modal
    //         const userId = interaction.user.id;
    //         const url = interaction.fields.getTextInputValue('contributionWorkUrl');

    //         // we try to upload the contribution to the database. if it fails, we send an error message to the user.
    //         const { message } = await submitContributionToDB(userId, url);

    //         await interaction.reply({ content: message, ephemeral: true });
    //     }
    // }
});

// BOT ON READY
client.on('ready', async c => {
    console.log(`Logged in as ${c.user.tag}`);

    mongoose.connect(process.env.MONGODB_URI);

    // //CRON JOBS (SCHEDULERS)
    // nextTagDistributionScheduler.start();
    // await distributeTagScheduler(client);
    // await restartDailyTagsAllowance();
    // await removeExpiredInvitesScheduler();
    // await tagsLeaderboardScheduler(process.env.COOKIES_LEADERBOARD_MESSAGEID, client);

    await Moralis.start({
        serverUrl: process.env.MORALIS_SERVERURL,
        appId: process.env.MORALIS_APPID,
        masterKey: process.env.MORALIS_MASTERKEY,
    });
});

// log in to bot
client.login(process.env.BOT_TOKEN);
