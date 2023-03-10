const { ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

const representativeVotingModal = (nation) => {
    return new ModalBuilder()
    .setCustomId('representativeVotingModal')
    .setTitle(`Vote for ${nation.toUpperCase()}\'s representatives!`)
    .addComponents([
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('nomineeId')
                .setLabel('Enter the User ID of your nominee')
                .setPlaceholder('e.g.: 123456789012345678')
                .setStyle(TextInputStyle.Short)
                .setMinLength(1),
        ),
    ]);
};

const rescindRepresentativeVoteModal = new ModalBuilder()
    .setCustomId('rescindRepresentativeVoteModal')
    .setTitle('Rescind your vote for a nominee')
    .addComponents([
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('nomineeToRescindId')
                .setLabel('Enter the User ID of the nominee')
                .setPlaceholder('e.g.: 123456789012345678')
                .setStyle(TextInputStyle.Short)
                .setMinLength(1),
        ),
    ]);

module.exports = {
    representativeVotingModal,
    rescindRepresentativeVoteModal,
};
