const { ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

const tradeNBMonModal = new ModalBuilder()
    .setCustomId('tradeNBMonModal')
    .setTitle('Trade your NBMon')
    .addComponents([
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('tradeNBMonNBMonId')
                .setLabel('Enter NBMon ID to trade')
                .setPlaceholder('e.g. 1')
                .setStyle(TextInputStyle.Short)
                .setMinLength(1),
        ),
    ]);

module.exports = {
    tradeNBMonModal,
};
