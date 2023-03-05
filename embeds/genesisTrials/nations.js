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

module.exports = {
    nationRoleEmbed,
};
