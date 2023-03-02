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
    if (message.content.toLowerCase() === '!showdailytagclaim') {
        if (!message.member._roles.includes(process.env.CREATORS_ROLEID)) return;
        await showClaimDailyTagsEmbed(message);
    }

    if (message.content.toLowerCase() === '!showcontributionembed') {
        if (!message.member._roles.includes(process.env.CREATORS_ROLEID)) return;
        await showSubmitContributionEmbed(message);
    }

    if (message.content.toLowerCase() === '!showchecktagscollected') {
        if (!message.member._roles.includes(process.env.CREATORS_ROLEID)) return;
        await showCheckTagsCollectedEmbed(message);
    }

    if (message.content.toLowerCase() === '!showrolenotifembed') {
        if (!message.member._roles.includes(process.env.CREATORS_ROLEID)) return;
        await showRoleNotifEmbed(message);
    }

    if (message.content.toLowerCase() === '!hunt claimtags') {
        const { message: claimMessage } = await updateTagsClaimed(message);
        await message.channel.send(claimMessage);
    }
});

// INTERACTION CREATE EVENT LISTENER
client.on('interactionCreate', async (interaction) => {
    // button interactions
    if (interaction.isButton()) {
        // when claim daily tags button is clicked. will run the `claimDailyTags` function to check if the user can claim their daily tags.
        if (interaction.customId === 'claimDailyTagsButton') {
            const { message } = await claimDailyTags(interaction);
            await interaction.reply({ content: message, ephemeral: true });
        }

        // when submit contribution button is clicked. will show the modal for submitting a contribution.
        if (interaction.customId === 'submitContributionButton') {
            await interaction.showModal(submitContributionModal);
        }

        // when check tags collected button is clicked. will show the user how many tags they have collected.
        if (interaction.customId === 'checkTagsCollectedButton') {
            const { message } = await checkTagsCollected(interaction.user.id);
            await interaction.reply({ content: message, ephemeral: true });
        }

        // when founder tweet notif gang button is clicked. will give them the founder tweet notif gang role.
        if (interaction.customId === 'founderTweetNotifGangButton') {
            const { message } = await giveRole(interaction, 'founderTweetNotifGang');
            await interaction.reply({ content: message, ephemeral: true });
        }

        if (interaction.customId === 'dailyTagsResetNotifButton') {
            const { message } = await giveRole(interaction, 'dailyTagsResetNotif');
            await interaction.reply({ content: message, ephemeral: true });
        }
    }

    // modal submit interactions
    if (interaction.type === InteractionType.ModalSubmit) {
        if (interaction.customId === 'submitContributionModal') {
            // get the user id and the contribution work url from the modal
            const userId = interaction.user.id;
            const url = interaction.fields.getTextInputValue('contributionWorkUrl');

            // we try to upload the contribution to the database. if it fails, we send an error message to the user.
            const { message } = await submitContributionToDB(userId, url);

            await interaction.reply({ content: message, ephemeral: true });
        }
    }
});

// BOT ON READY
client.on('ready', async c => {
    console.log(`Logged in as ${c.user.tag}`);

    mongoose.connect(process.env.MONGODB_URI);

    // CRON JOBS (SCHEDULERS)
    nextTagDistributionScheduler.start();
    await distributeTagScheduler(client);
    await restartDailyTagsAllowance();

    await Moralis.start({
        serverUrl: process.env.MORALIS_SERVERURL,
        appId: process.env.MORALIS_APPID,
        masterKey: process.env.MORALIS_MASTERKEY,
    });
});

// log in to bot
client.login(process.env.BOT_TOKEN);
