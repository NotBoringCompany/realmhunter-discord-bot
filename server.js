require('dotenv').config();
const fs = require('fs');
const path = require('path');

const { Client, GatewayIntentBits, Collection, InteractionType, MessageFlags } = require('discord.js');
const Moralis = require('moralis-v1/node');
const { claimDailyTags, showClaimDailyTagsEmbed } = require('./commands/genesisTrials/claimTags');
const { showContributionEmbed } = require('./commands/genesisTrials/submitContribution');
const { submitContributionModal } = require('./modals/submitContribution');
const { submitContributionToDB } = require('./utils/genesisTrials/submitContribution');

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
        await showContributionEmbed(message);
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
    }

    // modal submit interactions
    if (interaction.type === InteractionType.ModalSubmit) {
        if (interaction.customId === 'submitContributionModal') {
            // get the user id and the contribution work url from the modal
            const userId = interaction.user.id;
            const url = interaction.fields.getTextInputValue('contributionWorkUrl');

            // we try to upload the contribution to the database. if it fails, we send an error message to the user.
            const { status, message } = await submitContributionToDB(userId, url);

            await interaction.reply({ content: message, ephemeral: true });
        }
    }
});

// BOT ON READY
client.on('ready', async c => {
    console.log(`Logged in as ${c.user.tag}`);
    await Moralis.start({
        serverUrl: process.env.MORALIS_SERVERURL,
        appId: process.env.MORALIS_APPID,
        masterKey: process.env.MORALIS_MASTERKEY,
    });
});

// log in to bot
client.login(process.env.BOT_TOKEN);
