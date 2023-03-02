const { createAllianceLogic, inviteToAllianceLogic, disbandAllianceLogic, leaveAllianceLogic, delegateChiefRoleLogic } = require('../../utils/genesisTrials/alliance');

/**
 * Creates an alliance for the user.
 */
const createAlliance = async (message) => {
    try {
        // hunt and createAlliance are not used, but they are needed to split the message
        const [hunt, createAlliance, ...allianceName] = message.content.split(' ');

        if (allianceName[0].length > 16) {
            return {
                status: 'error',
                message: 'Alliance name cannot be longer than 16 characters.',
            };
        }
        return await createAllianceLogic(message.author.id, allianceName[0]);
    } catch (err) {
        throw err;
    }
};

/**
 * Invites a user to the alliance.
 */
const inviteToAlliance = async (message) => {
    try {
        const [hunt, inviteToAlliance, invitee] = message.content.split(' ');
        // we need to check if invitee is a valid user ID
        const server = message.guild;
        const inviteeId = await server.members.fetch(invitee[0]).catch((err) => {
            return {
                status: 'error',
                message: 'Invalid invitee ID.',
            };
        });

        return await inviteToAllianceLogic(message.author.id, inviteeId);
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
        const delegateeId = await server.members.fetch(delegatee[0]).catch((err) => {
            return {
                status: 'error',
                message: 'Invalid delegatee ID.',
            };
        });

        return await delegateChiefRoleLogic(message.author.id, delegateeId);
    } catch (err) {
        throw err;
    }
};

module.exports = {
    createAlliance,
    inviteToAlliance,
    disbandAlliance,
    leaveAlliance,
    delegateChiefRole,
};
