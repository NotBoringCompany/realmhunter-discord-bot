require('dotenv').config();
const fs = require('fs');
const path = require('path');

const { Client, GatewayIntentBits, Collection, InteractionType, MessageFlags } = require('discord.js');
const Moralis = require('moralis-v1/node');

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
