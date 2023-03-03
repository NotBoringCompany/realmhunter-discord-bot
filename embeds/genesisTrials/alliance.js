
const { EmbedBuilder } = require('discord.js');

/**
 * Shows an embed with the alliance members
 */
const showAllianceEmbed = (allianceName, membersData) => {
    return new EmbedBuilder()
        .setColor(0x42ca9f)
        .setTitle(`Alliance **${allianceName}**`)
        .setFields(membersData);
};

const showInviterPendingInvitesEmbed = (allianceName, pendingInvites) => {
    return new EmbedBuilder()
        .setColor(0x42ca9f)
        .setTitle(`Pending invites for Alliance **${allianceName}**`)
        .setFields(pendingInvites);
};

const showInviteePendingInvitesEmbed = (pendingInvites) => {
    return new EmbedBuilder()
        .setColor(0x42ca9f)
        .setTitle(`Pending alliance invites`)
        .setFields(pendingInvites);
};

module.exports = {
    showAllianceEmbed,
    showInviterPendingInvitesEmbed,
    showInviteePendingInvitesEmbed,
};
