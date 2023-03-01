const { ModalBuilder, ActionRowBuilder, TextInputStyle, TextInputBuilder } = require('discord.js');

const submitContributionModal = new ModalBuilder()
    .setCustomId('submitContributionModal')
    .setTitle('Submit community contribution')
    .addComponents([
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('contributionWorkUrl')
                .setLabel('Enter the URL of your work')
                .setPlaceholder('https://')
                .setStyle(TextInputStyle.Short)
                .setMinLength(1),
        ),
    ]);

module.exports = {
    submitContributionModal,
};
