const { ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

const attackBossModal = new ModalBuilder()
    .setCustomId('attackBossModal')
    .setTitle('Attack the boss NBMon!')
    .addComponents([
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('attackerNBMonId')
                .setLabel('Enter NBMon ID to attack the boss')
                .setPlaceholder('e.g. 1')
                .setStyle(TextInputStyle.Short)
                .setMinLength(1),
        ),
    ]);

module.exports = {
    attackBossModal,
};
