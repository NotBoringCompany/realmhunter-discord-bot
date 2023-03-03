const { createAllianceLogic, inviteToAllianceLogic, disbandAllianceLogic, leaveAllianceLogic, delegateChiefRoleLogic, showAllianceLogic, kickFromAllianceLogic, pendingAllianceInviteLogic, acceptAllianceInviteLogic, declineAllianceInviteLogic } = require('../../utils/genesisTrials/alliance');

/**
 * Creates an alliance for the user.
 */
const createAlliance = async (message) => {
    try {
        // hunt and createAlliance are not used, but they are needed to split the message
        const [hunt, createAlliance, ...allianceName] = message.content.split(' ');

        if (!allianceName[0]) {
            return {
                status: 'error',
                message: 'Alliance name cannot be empty.',
            };
        } else if (allianceName[0].length > 16) {
            return {
                status: 'error',
                message: 'Alliance name cannot be longer than 16 characters.',
            };
        } else {
            return await createAllianceLogic(message.author.id, allianceName[0]);
        }
    } catch (err) {
        throw err;
    }
};

/**
 * Gets called when a user invites another user to the alliance.
 * Will be pending until the invitee accepts the invite.
 */
const pendingAllianceInvite = async (message) => {
    try {
        const [hunt, inviteToAlliance, invitee] = message.content.split(' ');

        // we need to check if invitee is a valid user ID
        const server = message.guild;
        const getInvitee = await server.members.fetch(invitee).catch((err) => {
            return {
                status: 'error',
                message: 'Invalid invitee ID.',
            };
        });

        const inviteeId = getInvitee.id;

        return await pendingAllianceInviteLogic(message.author.id, inviteeId);
    } catch (err) {
        throw err;
    }
};

/**
 * Accepts an alliance invite.
 */
const acceptAllianceInvite = async (message) => {
    try {
        const [hunt, acceptAllianceInvite, ...allianceName] = message.content.split(' ');

        return await acceptAllianceInviteLogic(message.author.id, allianceName[0]);
    } catch (err) {
        throw err;
    }
};

/**
 * Declines an alliance invite.
 */
const declineAllianceInvite = async (message) => {
    try {
        const [hunt, declineAllianceInvite, ...allianceName] = message.content.split(' ');

        return await declineAllianceInviteLogic(message.author.id, allianceName[0]);
    } catch (err) {
        throw err;
    }
};

/**
 * Disbands the alliance.
 */
const disbandAlliance = async (message) => {
    try {
        return await disbandAllianceLogic(message.author.id);
    } catch (err) {
        throw err;
    }
};

/**
 * User leaves an alliance when called.
 */
const leaveAlliance = async (message) => {
    try {
        return await leaveAllianceLogic(message.author.id);
    } catch (err) {
        throw err;
    }
};

/**
 * Delegate chief role to another user.
 */
const delegateChiefRole = async (message) => {
    try {
        const [hunt, delegateChiefRole, delegatee] = message.content.split(' ');

        // we need to check if delegatee is a valid user ID
        const server = message.guild;
        const getDelegatee = await server.members.fetch(delegatee).catch((err) => {
            return {
                status: 'error',
                message: 'Invalid delegatee.',
            };
        });

        const delegateeId = getDelegatee.id;

        return await delegateChiefRoleLogic(message.author.id, delegateeId);
    } catch (err) {
        throw err;
    }
};

/**
 * Gets the alliance data.
 */
const showAlliance = async (client, message) => {
    try {
        const [hunt, showAlliance, ...allianceName] = message.content.split(' ');
        return await showAllianceLogic(client, allianceName[0]);
    } catch (err) {
        throw err;
    }
};

const kickFromAlliance = async (message) => {
    try {
        const [hunt, kickFromAlliance, userToKick] = message.content.split(' ');

        // we need to check if userToKick is a valid user ID
        const server = message.guild;
        const getUserToKick = await server.members.fetch(userToKick).catch((err) => {
            return {
                status: 'error',
                message: 'Invalid user ID to kick.',
            };
        });

        const userToKickId = getUserToKick.id;

        // console.log(userToKickId);
        // console.log(message.author.id);

        return await kickFromAllianceLogic(message.author.id, userToKickId);
    } catch (err) {
        throw err;
    }
};

module.exports = {
    createAlliance,
    pendingAllianceInvite,
    acceptAllianceInvite,
    declineAllianceInvite,
    disbandAlliance,
    leaveAlliance,
    delegateChiefRole,
    showAlliance,
    kickFromAlliance,
};
