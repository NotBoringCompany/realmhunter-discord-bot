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
const { restartDailyTagsAllowance, manuallyResetDailyTagsAllowance } = require('./utils/genesisTrials/dailyTags');
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
const { retrieveUnrewardedContributions, rewardContribution, invalidateContribution } = require('./commands/genesisTrials/rewardContributions');
const { showNationRoleEmbed, showRepresentativeVotingEmbed, showStakeTagsEmbed, sendPendingNationTags, showDistributeNationPendingTagsEmbed } = require('./commands/genesisTrials/nations');
const { createRole } = require('./commands/createRoles');
const { nationButtonInteraction } = require('./interactions/buttons/nationRoles');
const { manuallyRewardTags } = require('./commands/genesisTrials/manualRewarding');
const { restartDailyContributionTagsClaimedScheduler, restartDailyContributionTagsClaimed } = require('./utils/genesisTrials/rewardContributions');
const { representativeVotingModal } = require('./modals/nations');
const { getVotersNation, getCurrentVotesAvailable, submitVote, rescindVote, stakeTags, unstakeTags, showCumulativeNationTagsStaked, cumulativeNationTagsStakedScheduler, distributePendingTagsToMember } = require('./utils/genesisTrials/nations');
const { claimFirstQuestTags } = require('./utils/genesisTrials/questWinners');
const { showFirstQuestWinnerButtons } = require('./commands/genesisTrials/questWinners');
const { nationLeadVotesInteraction } = require('./interactions/buttons/nationLeadVotes');
const { nationTagStakingInteraction } = require('./interactions/buttons/nationTagStaking');
const { nationPendingTagsDistribution } = require('./interactions/buttons/nationPendingTags');

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
    // if (message.content.toLowerCase().startsWith('!hunt rewardnation')) {
    //     if (
    //         !message.member._roles.includes(process.env.CREATORS_ROLEID) ||
    //         !message.member._roles.includes(process.env.MODS_ROLEID)
    //     ) return;

    //     const { status, message: rewardNationMessage } = await sendPendingNationTags(message);
    //     return await message.channel.send(rewardNationMessage);
    // }

    if (message.content.toLowerCase() === '!showdistributenationpendingtagsembed') {
        if (!message.member._roles.includes(process.env.CREATORS_ROLEID)) return;
        await showDistributeNationPendingTagsEmbed(message);
    }

    // if (message.content.toLowerCase() === '!showcumulativenationtagsstaked') {
    //     if (!message.member._roles.includes(process.env.CREATORS_ROLEID)) return;
    //     const { status, message: cumulativeMessage, embed } = await showCumulativeNationTagsStaked();

    //     if (status === 'error') {
    //         return await message.channel.send(cumulativeMessage);
    //     } else {
    //         return await message.channel.send({ embeds: [embed] });
    //     }
    // }
    // if (message.content.toLowerCase() === '!showstaketagsembed') {
    //     if (!message.member._roles.includes(process.env.CREATORS_ROLEID)) return;
    //     await showStakeTagsEmbed(message);
    // }

    // if (message.content.toLowerCase() === '!showrepresentativevotingembed') {
    //     if (!message.member._roles.includes(process.env.CREATORS_ROLEID)) return;
    //     await showRepresentativeVotingEmbed(message);
    // }

    // if (message.content.toLowerCase() === '!showquestcollectcookiebuttons') {
    //     if (!message.member._roles.includes(process.env.CREATORS_ROLEID)) return;
    //     await showFirstQuestWinnerButtons(message);
    // }
    // if (message.content.toLowerCase().startsWith('!hunt manuallyrewardtags')) {
    //     if (!message.member._roles.includes(process.env.CREATORS_ROLEID)) return;
    //     const { status, message: rewardMessage } = await manuallyRewardTags(message).catch((err) => console.log(err));

    //     // if error, send the message in the channel where the command was sent
    //     if (status === 'error') {
    //         await message.channel.send(rewardMessage);
    //     // otherwise, send it to #general-chat.
    //     } else {
    //         await client.channels.cache.get(process.env.GENERAL_CHAT_CHANNELID).send(rewardMessage);
    //     }
    // }

    // if (message.content.toLowerCase() === '!resetdailytagsallowance') {
    //     if (!message.member._roles.includes(process.env.CREATORS_ROLEID)) return;
    //     const { message: resetMessage } = await manuallyResetDailyTagsAllowance().catch((err) => console.log(err));
    //     await message.channel.send(resetMessage);
    // }

    // if (message.content.toLowerCase() === '!hunt unrewardedcontributions') {
    //     if (!message.member._roles.includes(process.env.CREATORS_ROLEID)) return;
    //     const { status, message: contributionsMessage } = await retrieveUnrewardedContributions(message).catch((err) => console.log(err));

    //     await message.channel.send(contributionsMessage);
    // }

    // if (message.content.toLowerCase() === '!hunt manuallyresetdailycontributiontagsclaimed') {
    //     if (!message.member._roles.includes(process.env.CREATORS_ROLEID)) return;

    //     const { message: resetMessage } = await restartDailyContributionTagsClaimed().catch((err) => console.log(err));
    //     await message.channel.send(resetMessage);
    // }

    // if (message.content.toLowerCase().startsWith('!hunt invalidatecontribution')) {
    //     if (!message.member._roles.includes(process.env.CREATORS_ROLEID)) return;

    //     const { message: invalidateMessage } = await invalidateContribution(message).catch((err) => console.log(err));
    //     await message.channel.send(invalidateMessage);
    // }

    // if (message.content.toLowerCase().startsWith('!hunt rewardcontribution')) {
    //     if (!message.member._roles.includes(process.env.CREATORS_ROLEID)) return;
    //     const { status, message: contributionsMessage } = await rewardContribution(message).catch((err) => console.log(err));

    //     // if there's an error status, send the message in the channel where the command was sent
    //     if (status === 'error') {
    //         await message.channel.send(contributionsMessage);
    //     // otherwise, send it to the #rewarded-contributions channel
    //     } else {
    //         await client.channels.cache.get(process.env.REWARDED_CONTRIBUTIONS_CHANNELID).send(contributionsMessage);
    //     }
    // }

    // if (message.content.toLowerCase() === '!shownationsroleembed') {
    //     if (!message.member._roles.includes(process.env.CREATORS_ROLEID)) return;
    //     await showNationRoleEmbed(message).catch((err) => console.log(err));
    // }

    // if (message.content.toLowerCase().startsWith('!createrole')) {
    //     if (!message.member._roles.includes(process.env.CREATORS_ROLEID)) return;
    //     const { status, message: roleMessage } = await createRole(message).catch((err) => console.log(err));
    //     await message.channel.send(roleMessage);
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
    if (interaction.isButton()) {
        await nationPendingTagsDistribution(interaction);
    //     await nationTagStakingInteraction(interaction);
    //     await nationLeadVotesInteraction(interaction);

    //     if (interaction.customId === 'questCollectCookies') {
    //         const { message: questMessage } = await claimFirstQuestTags(interaction.user.id);
    //         await interaction.reply({ content: questMessage, ephemeral: true });
    //     }

    //     // if nation button is clicked. will run the `nationButtonInteraction` function to check if the user can get a nation.
    //     await nationButtonInteraction(interaction);

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
    }

    // // modal submit interactions
    // if (interaction.type === InteractionType.ModalSubmit) {
    //     if (interaction.customId === 'distributeNationPendingTagsModal') {
    //         const userId = interaction.fields.getTextInputValue('cookiesToDistributeUserId');
    //         const amountToGive = interaction.fields.getTextInputValue('cookiesToDistributeAmount');

    //         const { message: distributeMessage } = await distributePendingTagsToMember(interaction, userId, parseInt(amountToGive));
    //         await interaction.reply({ content: distributeMessage, ephemeral: true });
    //     }

    //     if (interaction.customId === 'stakeNationTagsModal') {
    //         const cookiesToStake = interaction.fields.getTextInputValue('cookiesToStakeAmount');
    //         const { message: stakeMessage } = await stakeTags(interaction.user.id, parseInt(cookiesToStake));

    //         await interaction.reply({ content: stakeMessage, ephemeral: true });
    //     }

    //     if (interaction.customId === 'unstakeNationTagsModal') {
    //         const cookiesToUnstake = interaction.fields.getTextInputValue('cookiesToUnstakeAmount');
    //         const { message: unstakeMessage } = await unstakeTags(interaction.user.id, parseInt(cookiesToUnstake));

    //         await interaction.reply({ content: unstakeMessage, ephemeral: true });
    //     }
    //     // if a user submits a contribution, we run the `submitContributionToDB` function to upload the contribution to the database.
    //     if (interaction.customId === 'submitContributionModal') {
    //         // get the user id and the contribution work url from the modal
    //         const userId = interaction.user.id;
    //         const url = interaction.fields.getTextInputValue('contributionWorkUrl');

    //         // we try to upload the contribution to the database. if it fails, we send an error message to the user.
    //         const { message } = await submitContributionToDB(userId, url);

    //         await interaction.reply({ content: message, ephemeral: true });
    //     }

    //     if (interaction.customId === 'representativeVotingModal') {
    //         const nomineeId = interaction.fields.getTextInputValue('nomineeId');
    //         const { message: voteMessage } = await submitVote(interaction, nomineeId);

    //         await interaction.reply({ content: voteMessage, ephemeral: true });
    //     }

    //     if (interaction.customId === 'rescindRepresentativeVoteModal') {
    //         const nomineeId = interaction.fields.getTextInputValue('nomineeToRescindId');
    //         const { message: voteMessage } = await rescindVote(interaction, nomineeId);

    //         await interaction.reply({ content: voteMessage, ephemeral: true });
    //     }
    // }
});

// BOT ON READY
client.on('ready', async c => {
    console.log(`Logged in as ${c.user.tag}`);

    mongoose.connect(process.env.MONGODB_URI);

    // // CRON JOBS (SCHEDULERS)
    // nextTagDistributionScheduler.start();
    // await distributeTagScheduler(client);
    // await restartDailyTagsAllowance();
    // await removeExpiredInvitesScheduler();
    // await restartDailyContributionTagsClaimedScheduler();
    // await tagsLeaderboardScheduler(process.env.COOKIES_LEADERBOARD_MESSAGEID, client);
    // await cumulativeNationTagsStakedScheduler(process.env.CUMULATIVE_COOKIES_STAKED_EMBED_MESSAGEID, client);

    await Moralis.start({
        serverUrl: process.env.MORALIS_SERVERURL,
        appId: process.env.MORALIS_APPID,
        masterKey: process.env.MORALIS_MASTERKEY,
    });
});

// log in to bot
client.login(process.env.BOT_TOKEN);
