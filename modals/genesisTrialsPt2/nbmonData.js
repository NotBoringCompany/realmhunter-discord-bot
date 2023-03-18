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

module.exports = {
    checkNBMonStatsModal,
};
