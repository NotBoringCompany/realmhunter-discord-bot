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

const stakeTagsModal = new ModalBuilder()
    .setCustomId('stakeNationTagsModal')
    .setTitle('Stake cookies for your nation!')
    .addComponents([
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('cookiesToStakeAmount')
                .setLabel('Enter amount of cookies to stake')
                .setPlaceholder('e.g.: 100')
                .setStyle(TextInputStyle.Short)
                .setMinLength(1),
        ),
    ]);

const unstakeTagsModal = new ModalBuilder()
    .setCustomId('unstakeNationTagsModal')
    .setTitle('Unstake your staked cookies')
    .addComponents([
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('cookiesToUnstakeAmount')
                .setLabel('Enter amount of cookies to unstake')
                .setPlaceholder('e.g.: 100')
                .setStyle(TextInputStyle.Short)
                .setMinLength(1),
        ),
    ]);

const distributeNationPendingTagsModal = new ModalBuilder()
    .setCustomId('distributeNationPendingTagsModal')
    .setTitle('Distribute cookies to your members')
    .addComponents([
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('cookiesToDistributeUserId')
                .setLabel('User ID of the member')
                .setPlaceholder('e.g.: 123456789012345678')
                .setStyle(TextInputStyle.Short)
                .setMinLength(1),
        ),
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('cookiesToDistributeAmount')
                .setLabel('Enter amount of cookies to distribute')
                .setPlaceholder('e.g.: 100')
                .setStyle(TextInputStyle.Short)
                .setMinLength(1),
        ),
    ]);

module.exports = {
    representativeVotingModal,
    rescindRepresentativeVoteModal,
    stakeTagsModal,
    unstakeTagsModal,
    distributeNationPendingTagsModal,
};
