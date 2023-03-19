const { ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

const checkNBMonStatsModal = new ModalBuilder()
    .setCustomId('checkNBMonStatsModal')
    .setTitle('Check NBMon stats')
    .addComponents([
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('checkNBMonStatsNBMonId')
                .setLabel('Enter ID to check its stats')
                .setPlaceholder('e.g. 1')
                .setStyle(TextInputStyle.Short)
                .setMinLength(1),
        ),
    ]);

const updateNBMonNameModal = new ModalBuilder()
    .setCustomId('updateNBMonNameModal')
    .setTitle('Update NBMon name')
    .addComponents([
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('updateNBMonNameNBMonId')
                .setLabel('Enter ID to update its name')
                .setPlaceholder('e.g. 1')
                .setStyle(TextInputStyle.Short)
                .setMinLength(1),
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('updateNBMonNameCustomName')
                .setLabel('Enter custom name')
                .setPlaceholder('e.g. My NBMon')
                .setStyle(TextInputStyle.Short)
                .setMinLength(1),
        ),
    ]);

module.exports = {
    checkNBMonStatsModal,
    updateNBMonNameModal,
};
