const { ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

const purchaseSHPModal = new ModalBuilder()
    .setCustomId('purchaseSHPModal')
    .setTitle('Purchase Simple Healing Potion')
    .addComponents([
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('shpNBMonId')
                .setLabel('Enter NBMon ID to use it on')
                .setPlaceholder('e.g. 1')
                .setStyle(TextInputStyle.Short)
                .setMinLength(1),
        ),
    ]);

const purchaseXPBoosterModal = new ModalBuilder()
    .setCustomId('purchaseXPBoosterModal')
    .setTitle('Purchase XP Booster')
    .addComponents([
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('xpBoosterNBMonId')
                .setLabel('Enter NBMon ID to use it on')
                .setPlaceholder('e.g. 1')
                .setStyle(TextInputStyle.Short)
                .setMinLength(1),
        ),
    ]);

module.exports = {
    purchaseSHPModal,
    purchaseXPBoosterModal,
};
