require('dotenv').config();
const mongoose = require('mongoose');
const { showAllianceEmbed, showInviterPendingInvitesEmbed, showInviteePendingInvitesEmbed, showOwnAllianceEmbed } = require('../../embeds/genesisTrials/alliance');
const { generateObjectId } = require('../cryptoUtils');
const permissions = require('../dbPermissions');
const { AllianceSchema, DiscordUserSchema, AlliancePendingInviteSchema } = require('../schemas');
const cron = require('node-cron');

mongoose.connect(process.env.MONGODB_URI);

/**
 * Creates an alliance when called and when the requirements are met.
 */
const createAllianceLogic = async (userId, allianceName) => {
    try {
        // we first check if such an alliance exists.
        const Alliance = mongoose.model('AllianceData', AllianceSchema, 'RHDiscordAllianceData');
        const allianceQuery = await Alliance.findOne({ allianceName: allianceName });

        // we will use the user to query later.
        const User = mongoose.model('UserData', DiscordUserSchema, 'RHDiscordUserData');
        const userQuery = await User.findOne({ userId: userId });

        const { _wperm, _rperm, _acl } = permissions(true, false);

        // if alliance doesn't exist, we first check is user exists in the database.
        if (!allianceQuery) {
            // if user doesn't exist, then we know the user is not in an alliance yet.
            // we can go ahead and create the alliance first.
            if (!userQuery) {
                // we want to store the objectId in a variable so we can add it as a pointer to the user's data.
                const allianceObjId = generateObjectId();
                const NewAlliance = new Alliance(
                    {
                        _id: allianceObjId,
                        _created_at: Date.now(),
                        _updated_at: Date.now(),
                        _wperm: _wperm,
                        _rperm: _rperm,
                        _acl: _acl,
                        allianceName: allianceName,
                        memberData: [
                            {
                                userId: userId,
                                role: 'chief',
                            },
                        ],
                    },
                );

                await NewAlliance.save();

                // once the alliance is created, we will now create the user's data (since the user doesn't exist).
                const NewUser = new User(
                    {
                        _id: generateObjectId(),
                        _created_at: Date.now(),
                        _updated_at: Date.now(),
                        _wperm: _wperm,
                        _rperm: _rperm,
                        _acl: _acl,
                        userId: userId,
                        hunterTags: 0,
                        realmPoints: 0,
                        dailyTagsClaimed: false,
                        dailyContributionTagsClaimed: false,
                        timesDistributionTagsClaimed: 0,
                        // pointer to alliance via its object ID in RHDiscordAllianceData.
                        _p_alliance: `${process.env.ALLIANCE_DB_NAME}$${allianceObjId}`,
                    },
                );

                await NewUser.save();

                return {
                    status: 'success',
                    message: 'Alliance created successfully',
                };
            // if user exists, we want to check if they are already in an alliance.
            } else {
                // check if user is in an alliance.
                const userAlliancePointer = userQuery._p_alliance;

                // if the pointer doesn't exist, that means that they are not in an alliance yet.
                // we now know two things:
                // 1. alliance doesn't exist
                // 2. user doesn't have an alliance.
                // therefore, we can add the alliance and add the user to the alliance.
                if (!userAlliancePointer) {
                    // we want to store the objectId in a variable so we can add it as a pointer to the user's data.
                    const allianceObjId = generateObjectId();
                    const NewAlliance = new Alliance(
                        {
                            _id: allianceObjId,
                            _created_at: Date.now(),
                            _updated_at: Date.now(),
                            _wperm: _wperm,
                            _rperm: _rperm,
                            _acl: _acl,
                            allianceName: allianceName,
                            memberData: [
                                {
                                    userId: userId,
                                    role: 'chief',
                                },
                            ],
                        },
                    );

                    await NewAlliance.save();

                    // once the alliance is created, we store the alliance's object ID in the user's data
                    userQuery._p_alliance = `${process.env.ALLIANCE_DB_NAME}$${allianceObjId}`;

                    await userQuery.save();

                    return {
                        status: 'success',
                        message: `Alliance ${allianceName} created successfully.`,
                    };
                // if the pointer exists, we know that the user is already in an alliance.
                // we will not create the alliance and instead return an error.
                } else {
                    return {
                        status: 'error',
                        message: 'You are already in an alliance.',
                    };
                }
            }
        // if alliance exists, we throw an error saying that the alliance already exists.
        } else {
            return {
                status: 'error',
                message: 'An alliance with that name already exists.',
            };
        }
    } catch (err) {
        console.log({
            errorFrom: 'createAllianceLogic',
            errorMessage: err.message,
        });
    }
};

/**
 * Called when an inviter invites an invitee to their alliance. The invite will be pending until the invitee accepts or declines.
 */
const pendingAllianceInviteLogic = async (inviterId, inviteeId) => {
    try {
        // first, we check if inviter exists.
        const User = mongoose.model('UserData', DiscordUserSchema, 'RHDiscordUserData');
        const inviterQuery = await User.findOne({ userId: inviterId });

        const { _wperm, _rperm, _acl } = permissions(true, false);

        // if inviterQuery is empty, then user doesn't exist (meaning the alliance doesn't exist). we throw an error.
        if (!inviterQuery) {
            return {
                status: 'error',
                message: 'You must create an alliance first.',
            };
        // if the query exists, we check if the user is in an alliance.
        } else {
            const inviterAlliancePointer = inviterQuery._p_alliance;

            // if the pointer is undefined, that means that the user is not in an alliance.
            if (!inviterAlliancePointer) {
                return {
                    status: 'error',
                    message: 'You must create an alliance first.',
                };
            // if the pointer exists, we know that the user is in an alliance. we check if they're the chief.
            } else {
                // we check if the user sent an invite to themselves.
                if (inviterId === inviteeId) {
                    return {
                        status: 'error',
                        message: 'You cannot send an invite to yourself.',
                    };
                }

                const Alliance = mongoose.model('AllianceData', AllianceSchema, 'RHDiscordAllianceData');
                // split to get the alliance's object ID.
                const allianceObjId = inviterAlliancePointer.split('$')[1];
                const allianceQuery = await Alliance.findOne({ _id: allianceObjId });

                // if the alliance doesn't exist, then something went wrong.
                // we request them to submit a ticket.
                if (!allianceQuery) {
                    return {
                        status: 'error',
                        message: 'An error occurred. Please submit a ticket.',
                    };
                // if the alliance exists, we check if the user is the chief.
                } else {
                    const role = allianceQuery.memberData.find((member) => member.userId === inviterId).role;

                    // if the user is not the chief, we throw an error.
                    if (role !== 'chief') {
                        return {
                            status: 'error',
                            message: 'Only the chief can invite members to the alliance.',
                        };
                    // if the user is the chief, we check if the invitee is already in an alliance.
                    } else {
                        // we first check if the alliance already has 5 members. if it does, we throw an error.
                        if (allianceQuery.memberData.length >= 5) {
                            return {
                                status: 'error',
                                message: 'Alliance already has 5 members. You cannot invite more members.',
                            };
                        }

                        const inviteeQuery = await User.findOne({ userId: inviteeId });
                        // if the invitee doesn't exist, then we will:
                        // 1. create the invitee's data.
                        // 2. add the pending invite to the `RHDiscordPendingAllianceInvites` database.

                        if (!inviteeQuery) {
                            const NewUser = new User(
                                {
                                    _id: generateObjectId(),
                                    _created_at: Date.now(),
                                    _updated_at: Date.now(),
                                    _wperm: _wperm,
                                    _rperm: _rperm,
                                    _acl: _acl,
                                    userId: inviteeId,
                                    hunterTags: 0,
                                    realmPoints: 0,
                                    dailyTagsClaimed: false,
                                    dailyContributionTagsClaimed: false,
                                    timesDistributionTagsClaimed: 0,
                                    _p_alliance: undefined,
                                },
                            );

                            await NewUser.save();

                            // once the invitee data is created, we add the pending invite to the `RHDiscordPendingAllianceInvites` database.
                            const PendingAllianceInvite = mongoose.model('PendingAllianceInviteData', AlliancePendingInviteSchema, 'RHDiscordPendingAllianceInvites');

                            // we create the pending invite.
                            const NewPendingInvite = new PendingAllianceInvite(
                                {
                                    _id: generateObjectId(),
                                    _created_at: Date.now(),
                                    _updated_at: Date.now(),
                                    _wperm: _wperm,
                                    _rperm: _rperm,
                                    _acl: _acl,
                                    inviterId: inviterId,
                                    inviteeId: inviteeId,
                                    invitedTimestamp: Math.floor(new Date().getTime() / 1000),
                                    // 1 day from now.
                                    inviteExpiryTimestamp: Math.floor(new Date().getTime() / 1000) + 86400,
                                    _p_alliance: inviterAlliancePointer,
                                },
                            );

                            await NewPendingInvite.save();

                            // we return a success message.
                            return {
                                status: 'success',
                                message: `<@${inviterId}> has invited <@${inviteeId}> to Alliance ${allianceQuery.allianceName}. They have 24 hours to accept the invite.`,
                            };
                        // if the invitee exists, we check if they're in an alliance.
                        } else {
                            const inviteeAlliancePointer = inviteeQuery._p_alliance;

                            // if the invitee is not in an alliance, we first check if they have a similar pending invite.
                            if (!inviteeAlliancePointer) {
                                const PendingAllianceInvite = mongoose.model('PendingAllianceInviteData', AlliancePendingInviteSchema, 'RHDiscordPendingAllianceInvites');
                                const pendingInviteQuery = await PendingAllianceInvite.findOne({ inviterId: inviterId, inviteeId: inviteeId, _p_alliance: inviterAlliancePointer });

                                // if such an invite doesn't exist, we create one.
                                if (!pendingInviteQuery) {
                                    const NewPendingInvite = new PendingAllianceInvite(
                                        {
                                            _id: generateObjectId(),
                                            _created_at: Date.now(),
                                            _updated_at: Date.now(),
                                            _wperm: _wperm,
                                            _rperm: _rperm,
                                            _acl: _acl,
                                            inviterId: inviterId,
                                            inviteeId: inviteeId,
                                            invitedTimestamp: Math.floor(new Date().getTime() / 1000),
                                            // 1 day from now.
                                            inviteExpiryTimestamp: Math.floor(new Date().getTime() / 1000) + 86400,
                                            _p_alliance: inviterAlliancePointer,
                                        },
                                    );

                                    await NewPendingInvite.save();

                                    // we return a success message.
                                    return {
                                        status: 'success',
                                        message: `<@${inviterId}> has invited <@${inviteeId}> to Alliance ${allianceQuery.allianceName}. They have 24 hours to accept the invite.`,
                                    };
                                // if such an invite exists, we throw an error.
                                } else {
                                    return {
                                        status: 'error',
                                        message: 'You have already invited this user to your alliance. Awaiting their response.',
                                    };
                                }
                            // if the invitee is in an alliance, we throw an error.
                            } else {
                                return {
                                    status: 'error',
                                    message: 'This user is already in an alliance.',
                                };
                            }
                        }
                    }
                }
            }
        }
    } catch (err) {
        console.log({
            errorFrom: 'pendingAllianceInviteLogic',
            errorMessage: err.message,
        });
    }
};

/**
 * Shows the pending invites sent by the inviter.
 */
const showInviterPendingInvitesLogic = async (client, inviterId) => {
    try {
        // first, we check if the inviter exists.
        const User = mongoose.model('UserData', DiscordUserSchema, 'RHDiscordUserData');
        const inviterQuery = await User.findOne({ userId: inviterId });

        // if the inviter doesn't exist, we throw an error.
        if (!inviterQuery) {
            return {
                embed: 'none',
                status: 'error',
                message: 'You are not in an alliance.',
            };
        // if user exists, we first check if they have an alliance.
        } else {
            const inviterAlliancePointer = inviterQuery._p_alliance;

            // if the inviter is not in an alliance, we throw an error.
            if (!inviterAlliancePointer) {
                return {
                    embed: 'none',
                    status: 'error',
                    message: 'You are not in an alliance.',
                };
            // if the inviter is in an alliance, we show the pending invites.
            } else {
                // we get the list of pending invites and their timestamp.
                const PendingAllianceInvite = mongoose.model('PendingAllianceInviteData', AlliancePendingInviteSchema, 'RHDiscordPendingAllianceInvites');
                const pendingInvitesQuery = await PendingAllianceInvite.find({ inviterId: inviterId, _p_alliance: inviterAlliancePointer });

                const pendingInvites = [];

                const Alliance = mongoose.model('AllianceData', AllianceSchema, 'RHDiscordAllianceData');
                // split to get the alliance's object ID.
                const allianceObjId = inviterAlliancePointer.split('$')[1];
                const allianceQuery = await Alliance.findOne({ _id: allianceObjId });

                const allianceName = allianceQuery.allianceName ? allianceQuery.allianceName : 'No alliance name';

                // if no pending invites, we return an embed saying 'no pending invites'.
                if (!pendingInvitesQuery) {
                    return {
                        embed: showInviterPendingInvitesEmbed(allianceName, {
                            name: 'Invites',
                            value: 'No pending invites.',
                        }),
                        status: 'success',
                        message: 'No pending invites.',
                    };
                // if there are pending invites, we return an embed with the list of pending invites.
                } else {
                    for (let i = 0; i < pendingInvitesQuery.length; i++) {
                        const invite = pendingInvitesQuery[i];

                        const inviteeId = invite.inviteeId;

                        // get the invitee's username.
                        const inviteeData = await client.users.fetch(inviteeId);
                        const userTag = inviteeData.username + '#' + inviteeData.discriminator;

                        pendingInvites.push({
                            name: `**${userTag}**`,
                            value: `Invited: **${new Date(parseInt(invite.invitedTimestamp)* 1000).toUTCString()}**`,
                        });
                    }

                    return {
                        embed: showInviterPendingInvitesEmbed(allianceName, pendingInvites),
                        status: 'success',
                        message: 'Pending invites.',
                    };
                }
            }
        }
    } catch (err) {
        console.log({
            errorFrom: 'showInviterPendingInvitesLogic',
            errorMessage: err.message,
        });
    }
};

/**
 * Shows the pending invites sent to the invitee.
 */
const showInviteePendingInvitesLogic = async (client, inviteeId) => {
    try {
        // first, we check if the invitee exists.
        const User = mongoose.model('UserData', DiscordUserSchema, 'RHDiscordUserData');
        const inviteeQuery = await User.findOne({ userId: inviteeId });

        // if the invitee doesn't exist, we return no pending invites.
        if (!inviteeQuery) {
            return {
                embed: showInviteePendingInvitesEmbed([{
                    name: 'Pending invites',
                    value: 'You do not have any pending invites.',
                }]),
                status: 'success',
                message: 'You do not have any pending invites.',
            };
        // otherwise, we get the list of pending invites.
        } else {
            // we get the list of pending invites and their timestamp.
            const PendingAllianceInvite = mongoose.model('PendingAllianceInviteData', AlliancePendingInviteSchema, 'RHDiscordPendingAllianceInvites');
            const pendingInvitesQuery = await PendingAllianceInvite.find({ inviteeId: inviteeId });

            const pendingInvites = [];

            // if no pending invites, we return an embed saying 'no pending invites'.
            if (!pendingInvitesQuery) {
                return {
                    embed: showInviteePendingInvitesEmbed([{
                        name: 'Pending invites',
                        value: 'You do not have any pending invites.',
                    }]),
                    status: 'success',
                    message: 'You do not have any pending invites.',
                };
            // if there are pending invites, we return an embed with the list of pending invites.
            } else {
                let alliancePointer;
                const Alliance = mongoose.model('AllianceData', AllianceSchema, 'RHDiscordAllianceData');

                for (let i = 0; i < pendingInvitesQuery.length; i++) {
                    alliancePointer = pendingInvitesQuery[i]._p_alliance;
                    // split to get the alliance's object ID.
                    const allianceObjId = alliancePointer.split('$')[1];
                    const allianceQuery = await Alliance.findOne({ _id: allianceObjId });
                    const allianceName = allianceQuery.allianceName ? allianceQuery.allianceName : 'N/A';

                    const invite = pendingInvitesQuery[i];

                    const inviterId = invite.inviterId;

                    // get the inviter's username.
                    const inviterData = await client.users.fetch(inviterId);
                    const userTag = inviterData.username + '#' + inviterData.discriminator;

                    pendingInvites.push({
                        name: `Invite from **${userTag}** to join Alliance **${allianceName}**`,
                        value: `Invited: **${new Date(parseInt(invite.invitedTimestamp)* 1000).toUTCString()}**`,
                    });
                }

                return {
                    embed: showInviteePendingInvitesEmbed(pendingInvites),
                    status: 'success',
                    message: 'Pending invites.',
                };
            }
        }
    } catch (err) {
        console.log({
            errorFrom: 'showInviteePendingInvitesLogic',
            errorMessage: err.message,
        });
    }
};

/**
 * Rescinds a pending invite from the inviter to the invitee.
 */
const rescindPendingInviteLogic = async (inviterId, inviteeId) => {
    try {
        // first, we check if the inviter exists.
        const User = mongoose.model('UserData', DiscordUserSchema, 'RHDiscordUserData');
        const inviterQuery = await User.findOne({ userId: inviterId });

        // if the inviter doesn't exist, we throw an error.
        if (!inviterQuery) {
            return {
                status: 'error',
                message: 'You are not in an alliance.',
            };
        // if user exists, we first check if they have an alliance.
        } else {
            const inviterAlliancePointer = inviterQuery._p_alliance;

            // if the inviter is not in an alliance, we throw an error.
            if (!inviterAlliancePointer) {
                return {
                    status: 'error',
                    message: 'You are not in an alliance.',
                };
            // otherwise, we now check if the invite to the invitee exists.
            } else {
                const PendingAllianceInvite = mongoose.model('PendingAllianceInviteData', AlliancePendingInviteSchema, 'RHDiscordPendingAllianceInvites');
                const inviteQuery = await PendingAllianceInvite.findOne({ inviterId: inviterId, inviteeId: inviteeId, _p_alliance: inviterAlliancePointer });

                // if the invite doesn't exist, we throw an error.
                if (!inviteQuery) {
                    return {
                        status: 'error',
                        message: 'Invite invalid or doesn\'t exist.',
                    };
                // if the invite exists, we delete it.
                } else {
                    await inviteQuery.delete();

                    return {
                        status: 'success',
                        message: 'Invite rescinded.',
                    };
                }
            }
        }
    } catch (err) {
        console.log({
            errorFrom: 'rescindPendingInvitesLogic',
            errorMessage: err.message,
        });
    }
};

/**
 * Gets called when an invitee accepts an invite to join the alliance.
 */
const acceptAllianceInviteLogic = async (inviteeId, allianceName) => {
    try {
        // we first check if the invitee exists.
        const User = mongoose.model('UserData', DiscordUserSchema, 'RHDiscordUserData');
        const inviteeQuery = await User.findOne({ userId: inviteeId });

        // if the invitee doesn't exist, then something is wrong.
        // we request them to submit a ticket.
        if (!inviteeQuery) {
            return {
                status: 'error',
                message: 'Something went wrong. Please submit a ticket.',
            };
        // if they exist, we check if the invite is still valid.
        } else {
            // we need to query for the alliance via the name.
            const Alliance = mongoose.model('AllianceData', AllianceSchema, 'RHDiscordAllianceData');
            const allianceQuery = await Alliance.findOne({ allianceName: allianceName });

            // if alliance is not found, maybe the `allianceName` is wrong. return an error.
            if (!allianceQuery) {
                return {
                    status: 'error',
                    message: 'Alliance not found.',
                };
            // if the alliance exists, get the objectId of the alliance.
            } else {
                // we first check if the alliance already has 5 members. if they do, we throw an error.
                if (allianceQuery.memberData.length >= 5) {
                    return {
                        status: 'error',
                        message: 'Alliance is already full.',
                    };
                }

                const objId = allianceQuery._id;
                // get the pointer.
                const alliancePointer = `${process.env.ALLIANCE_DB_NAME}$${objId}`;

                // we query for the pending invite.
                const PendingAllianceInvite = mongoose.model('PendingAllianceInviteData', AlliancePendingInviteSchema, 'RHDiscordPendingAllianceInvites');
                const inviteQuery = await PendingAllianceInvite.findOne({ inviteeId: inviteeId, _p_alliance: alliancePointer });

                // if the invite query is empty, then the invite is either invalid or expired.
                if (!inviteQuery) {
                    return {
                        status: 'error',
                        message: 'Invite is either invalid or expired.',
                    };
                // if the invite still exists, we will add the invitee to the alliance.
                } else {
                    allianceQuery.memberData.push(
                        {
                            userId: inviteeId,
                            role: 'member',
                        },
                    );

                    await allianceQuery.save();

                    // update the pointer in the invitee's document.
                    inviteeQuery._p_alliance = alliancePointer;

                    await inviteeQuery.save();

                    // we delete the invite.
                    await inviteQuery.delete();

                    return {
                        status: 'success',
                        message: `<@${inviteeId}> has joined Alliance ${allianceQuery.allianceName}.`,
                    };
                }
            }
        }
    } catch (err) {
        console.log({
            errorFrom: 'acceptAllianceInviteLogic',
            errorMessage: err.message,
        });
    }
};

/**
 * Gets called when an invitee declines an invite to join the alliance.
 */
const declineAllianceInviteLogic = async (inviteeId, allianceName) => {
    try {
        // we first check if the invitee exists.
        const User = mongoose.model('UserData', DiscordUserSchema, 'RHDiscordUserData');
        const inviteeQuery = await User.findOne({ userId: inviteeId });

        // if the invitee doesn't exist, then something is wrong.
        // we request them to submit a ticket.
        if (!inviteeQuery) {
            return {
                status: 'error',
                message: 'Something went wrong. Please submit a ticket.',
            };
        // if they exist, we check if the invite is still valid.
        } else {
            // we need to query for the alliance via the name.
            const Alliance = mongoose.model('AllianceData', AllianceSchema, 'RHDiscordAllianceData');
            const allianceQuery = await Alliance.findOne({ allianceName: allianceName });

            // if alliance is not found, maybe the `allianceName` is wrong. return an error.
            if (!allianceQuery) {
                return {
                    status: 'error',
                    message: 'Alliance not found.',
                };
            // if the alliance exists, we check for a few things.
            } else {
                const objId = allianceQuery._id;
                // get the pointer.
                const alliancePointer = `${process.env.ALLIANCE_DB_NAME}$${objId}`;

                // we query for the pending invite.
                const PendingAllianceInvite = mongoose.model('PendingAllianceInviteData', AlliancePendingInviteSchema, 'RHDiscordPendingAllianceInvites');
                const inviteQuery = await PendingAllianceInvite.findOne({ inviteeId: inviteeId, _p_alliance: alliancePointer });

                // if the invite query is empty, then the invite is either invalid or expired.
                if (!inviteQuery) {
                    return {
                        status: 'error',
                        message: 'Invite is either invalid or expired.',
                    };
                // if the invite still exists, we will delete the invite.
                } else {
                    await inviteQuery.delete();

                    return {
                        status: 'success',
                        message: `<@${inviteeId}> has declined the invite to join Alliance ${allianceQuery.allianceName}.`,
                    };
                }
            }
        }
    } catch (err) {
        console.log({
            errorFrom: 'declineAllianceInviteLogic',
            errorMessage: err.message,
        });
    }
};

/**
 * Called when a user wants to disband their alliance. Only the chief can disband the alliance.
 */
const disbandAllianceLogic = async (userId) => {
    try {
        // we first query the user's data.
        const User = mongoose.model('UserData', DiscordUserSchema, 'RHDiscordUserData');
        const userQuery = await User.findOne({ userId: userId });

        // if user doesn't exist, there's no alliance to disband.
        if (!userQuery) {
            return {
                status: 'error',
                message: 'You do not have an alliance to disband.',
            };
        // if user exists, we check if the user is in an alliance.
        } else {
            const userAlliancePointer = userQuery._p_alliance;

            // if the pointer doesn't exist, then they're not in an alliance. throw an error.
            if (!userAlliancePointer) {
                return {
                    status: 'error',
                    message: 'You do not have an alliance to disband.',
                };
            // otherwise (if the pointer exists), we will first check if the user is the chief.
            } else {
                const Alliance = mongoose.model('AllianceData', AllianceSchema, 'RHDiscordAllianceData');
                // split to get the alliance's object ID.
                const allianceObjId = userAlliancePointer.split('$')[1];
                const allianceQuery = await Alliance.findOne({ _id: allianceObjId });

                // at this point, if the alliance doesn't exist, then something is wrong.
                // we request them to submit a ticket.
                if (!allianceQuery) {
                    return {
                        status: 'error',
                        message: 'Something went wrong. Please submit a ticket.',
                    };
                // if the alliance exists, we check if the user is the chief.
                } else {
                    const role = allianceQuery.memberData.find((member) => member.userId === userId).role;

                    // if their role is not chief, then they're not allowed to disband the alliance.
                    if (role !== 'chief') {
                        return {
                            status: 'error',
                            message: 'Only the alliance\'s chief can disband the alliance.',
                        };
                    // otherwise, we will go ahead and disband the alliance.
                    } else {
                        // to do this, we need to:
                        // 1. remove the alliance pointer from all members.
                        // 2. delete the alliance data.

                        /// remove the alliance pointer from all its members.
                        // to do so, we first get all the member's user IDs.
                        const memberUserIds = allianceQuery.memberData.map((member) => member.userId);

                        // get the model ready
                        const User = mongoose.model('UserData', DiscordUserSchema, 'RHDiscordUserData');

                        // then we loop through each member's user ID and remove the alliance pointer.
                        for (let i = 0; i < memberUserIds.length; i++) {
                            const userQuery = await User.findOne({ userId: memberUserIds[i] });

                            // set the alliance pointer to undefined.
                            userQuery._p_alliance = undefined;

                            await userQuery.save();
                        };

                        // once each member's alliance pointer is removed, we can delete the alliance data.
                        await allianceQuery.deleteOne();

                        return {
                            status: 'success',
                            message: 'Alliance disbanded successfully.',
                        };
                    }
                }
            }
        }
    } catch (err) {
        console.log({
            errorFrom: 'disbandAllianceLogic',
            errorMessage: err.message,
        });
    }
};

/**
 * Called when a user wants to leave their alliance.
 */
const leaveAllianceLogic = async (userId) => {
    try {
        // we first check if the user exists.
        const User = mongoose.model('UserData', DiscordUserSchema, 'RHDiscordUserData');
        const userQuery = await User.findOne({ userId: userId });

        // if the user doesn't exist, then they're not in an alliance anyway.
        if (!userQuery) {
            return {
                status: 'error',
                message: 'You are not in an alliance.',
            };
        // if the user exists, we check if they are in an alliance.
        } else {
            const userAlliancePointer = userQuery._p_alliance;

            // if the pointer doesn't exist, then they're not in an alliance. throw an error.
            if (!userAlliancePointer) {
                return {
                    status: 'error',
                    message: 'You are not in an alliance.',
                };
            // if the pointer exists, they are in an alliance, we first check if they are the chief.
            } else {
                const Alliance = mongoose.model('AllianceData', AllianceSchema, 'RHDiscordAllianceData');
                // split to get the alliance's object ID.
                const allianceObjId = userAlliancePointer.split('$')[1];
                const allianceQuery = await Alliance.findOne({ _id: allianceObjId });

                // if somehow the alliance doesn't exist, then something went wrong.
                // we request them to submit a ticket.
                if (!allianceQuery) {
                    return {
                        status: 'error',
                        message: 'Something went wrong. Please submit a ticket.',
                    };
                // if the alliance exists, we check if the user is the chief.
                } else {
                    const role = allianceQuery.memberData.find((member) => member.userId === userId).role;

                    // if the user is the chief, we will not allow them to leave the alliance.
                    // we will request them to either:
                    // 1. delegate another member as the chief.
                    // 2. disband the alliance as a whole.
                    if (role === 'chief') {
                        return {
                            status: 'error',
                            message: 'You are the chief of the alliance. Please either delegate another member as the chief or disband the alliance.',
                        };
                    // if the user is not the chief, we will go ahead and remove them from the alliance.
                    } else {
                        // we will:
                        // 1. remove the alliance pointer from the user.
                        // 2. remove the user from the alliance's member data.

                        /// remove the alliance pointer from the user.
                        // set the alliance pointer to undefined.
                        userQuery._p_alliance = undefined;

                        await userQuery.save();

                        // afterwards, we will remove the user from the alliance's member data.
                        // to do so, we first get the user's index in the member data.
                        const memberIndex = allianceQuery.memberData.findIndex((member) => member.userId === userId);

                        // then we remove the user from the member data.
                        allianceQuery.memberData.splice(memberIndex, 1);

                        await allianceQuery.save();

                        return {
                            status: 'success',
                            message: 'You have left the alliance successfully.',
                        };
                    }
                }
            }
        }
    } catch (err) {
        console.log({
            errorFrom: 'leaveAllianceLogic',
            errorMessage: err.message,
        });
    }
};

/**
 * Called when a user wants to delegate another member as the chief. The caller MUST be the current chief.
 */
const delegateChiefRoleLogic = async (userId, newChiefId) => {
    try {
        // first, we check if the user exists.
        const User = mongoose.model('UserData', DiscordUserSchema, 'RHDiscordUserData');
        const userQuery = await User.findOne({ userId: userId });

        // if the user doesn't exist, then they're not in an alliance anyway.
        if (!userQuery) {
            return {
                status: 'error',
                message: 'You are not in an alliance.',
            };
        // if the user exists, we check if they are in an alliance.
        } else {
            const userAlliancePointer = userQuery._p_alliance;

            // if the pointer doesn't exist, then they're not in an alliance. throw an error.
            if (!userAlliancePointer) {
                return {
                    status: 'error',
                    message: 'You are not in an alliance.',
                };
            // if the pointer exists, they are in an alliance, we first check if they are the chief.
            } else {
                const Alliance = mongoose.model('AllianceData', AllianceSchema, 'RHDiscordAllianceData');
                // split to get the alliance's object ID.
                const allianceObjId = userAlliancePointer.split('$')[1];
                const allianceQuery = await Alliance.findOne({ _id: allianceObjId });

                // if somehow the alliance doesn't exist, then something went wrong.
                // we request them to submit a ticket.
                if (!allianceQuery) {
                    return {
                        status: 'error',
                        message: 'Something went wrong. Please submit a ticket.',
                    };
                // if the alliance exists, we check if the user is the chief.
                } else {
                    const role = allianceQuery.memberData.find((member) => member.userId === userId).role;

                    // if the user is not the chief, we will not allow them to delegate the chief role.
                    if (role !== 'chief') {
                        return {
                            status: 'error',
                            message: 'You are not the chief of the alliance. Only the chief can delegate the chief role.',
                        };
                    // if the user is the chief, we will go ahead and delegate the chief role.
                    // we will check if the newChiefId is a member of the alliance.
                    } else {
                        if (userId === newChiefId) {
                            return {
                                status: 'error',
                                message: 'You cannot delegate the chief role to yourself.',
                            };
                        }

                        console.log(userId);
                        console.log(newChiefId);

                        const newChief = allianceQuery.memberData.find((member) => member.userId === newChiefId);

                        // if newChief is undefined, then the new chief is not a member of the alliance.
                        if (!newChief) {
                            return {
                                status: 'error',
                                message: 'The delegatee is not a member of the alliance.',
                            };
                        // if newChief exists, then we can go ahead and do two things.
                        // 1. set the new chief's role to chief.
                        // 2. set the old chief's role to member.
                        } else {
                            await Alliance.updateOne({ _id: allianceObjId, 'memberData.userId': newChiefId }, { $set: { 'memberData.$.role': 'chief' } });
                            await Alliance.updateOne({ _id: allianceObjId, 'memberData.userId': userId }, { $set: { 'memberData.$.role': 'member' } });

                            return {
                                status: 'success',
                                message: 'The chief role has been delegated.',
                            };
                        }
                    }
                }
            }
        }
    } catch (err) {
        console.log({
            errorFrom: 'delegateChiefRoleLogic',
            errorMessage: err.message,
        });
    }
};

/**
 * Shows an alliance's data (members, etc.)
 */
const showAllianceLogic = async (client, allianceName) => {
    try {
        // we first check if the alliance exists.
        const Alliance = mongoose.model('AllianceData', AllianceSchema, 'RHDiscordAllianceData');
        const allianceQuery = await Alliance.findOne({ allianceName: allianceName });

        // converting the members array into a readable format for the embed
        const membersData = [];

        // if the alliance doesn't exist, we throw an error.
        if (!allianceQuery) {
            return {
                embed: 'none',
                status: 'error',
                message: 'The alliance does not exist.',
            };
        // if the alliance exists, we will return an embed.
        } else {
            const members = allianceQuery.memberData;

            for (let i = 0; i < members.length; i++) {
                const member = members[i];

                // get the usertag of the member
                const user = await client.users.fetch(member.userId);
                const userTag = user.username + '#' + user.discriminator;

                membersData.push({
                    name: `**${userTag}**`,
                    value: `Role: ${member.role}`,
                });
            }
        }

        return {
            embed: showAllianceEmbed(allianceName, membersData),
            status: 'success',
            message: 'Successfully retrieved alliance data.',
        };
    } catch (err) {
        console.log({
            errorFrom: 'showAllianceLogic',
            errorMessage: err.message,
        });
    }
};

/**
 * Shows own alliance data when called.
 */
const showOwnAllianceLogic = async (client, userId) => {
    try {
        // we first check if the user has an alliance.
        const User = mongoose.model('UserData', DiscordUserSchema, 'RHDiscordUserData');
        const userQuery = await User.findOne({ userId: userId });

        // if user isn't found, then they're not in an alliance anyway.
        if (!userQuery) {
            return {
                embed: 'none',
                status: 'error',
                message: 'You are not in an alliance.',
            };
        // if user is found, we check if they are in an alliance.
        } else {
            const userAlliancePointer = userQuery._p_alliance;

            // if the pointer doesn't exist, then they're not in an alliance. throw an error.
            if (!userAlliancePointer) {
                return {
                    embed: 'none',
                    status: 'error',
                    message: 'You are not in an alliance.',
                };
            // otherwise, we check if the alliance exists.
            } else {
                const Alliance = mongoose.model('AllianceData', AllianceSchema, 'RHDiscordAllianceData');
                // split to get the alliance's object ID.
                const allianceObjId = userAlliancePointer.split('$')[1];
                const allianceQuery = await Alliance.findOne({ _id: allianceObjId });

                // if the alliance doesn't exist, then something went wrong.
                // we request them to submit a ticket.
                if (!allianceQuery) {
                    return {
                        embed: 'none',
                        status: 'error',
                        message: 'Something went wrong. Please submit a ticket.',
                    };
                // otherwise, we return an embed of the alliance.
                } else {
                    const membersData = [];
                    const members = allianceQuery.memberData;

                    for (let i = 0; i < members.length; i++) {
                        const member = members[i];

                        // get the usertag of the member
                        const user = await client.users.fetch(member.userId);
                        const userTag = user.username + '#' + user.discriminator;

                        membersData.push({
                            name: `**${userTag}**`,
                            value: `Role: ${member.role}`,
                        });
                    }

                    return {
                        embed: showOwnAllianceEmbed(allianceQuery.allianceName, membersData),
                        status: 'success',
                        message: 'Successfully retrieved alliance data.',
                    };
                }
            }
        }
    } catch (err) {
        console.log({
            errorFrom: 'showOwnAllianceLogic',
            errorMessage: err.message,
        });
    }
};

/**
 * Kicks a user from an alliance. Only the chief can kick a user.
 */
const kickFromAllianceLogic = async (userId, targetId) => {
    try {
        // we first check if the user exists.
        const User = mongoose.model('UserData', DiscordUserSchema, 'RHDiscordUserData');
        const userQuery = await User.findOne({ userId: userId });

        // if the user doesn't exist, then they're not in an alliance anyway.
        if (!userQuery) {
            return {
                status: 'error',
                message: 'You are not in an alliance.',
            };
        // if the user exists, we check if they are in an alliance and if they're the chief.
        } else {
            const userAlliancePointer = userQuery._p_alliance;

            // if the pointer doesn't exist, then they're not in an alliance. throw an error.
            if (!userAlliancePointer) {
                return {
                    status: 'error',
                    message: 'You are not in an alliance.',
                };
            // if the pointer exists, they are in an alliance. we first check if they are the chief.
            } else {
                const Alliance = mongoose.model('AllianceData', AllianceSchema, 'RHDiscordAllianceData');
                // split to get the alliance's object ID.
                const allianceObjId = userAlliancePointer.split('$')[1];
                const allianceQuery = await Alliance.findOne({ _id: allianceObjId });

                // if somehow the alliance doesn't exist, then something went wrong.
                if (!allianceQuery) {
                    return {
                        status: 'error',
                        message: 'Something went wrong. Please submit a ticket.',
                    };
                // if the alliance exists, we check if the user is the chief.
                } else {
                    const role = allianceQuery.memberData.find((member) => member.userId === userId).role;

                    // if they are not the chief, we will not allow them to kick a user.
                    if (role !== 'chief') {
                        return {
                            status: 'error',
                            message: 'Only the chief of the alliance can kick a member.',
                        };
                    // if they are the chief, we will go ahead and kick the user.
                    } else {
                        // we will check if the targetId is a member of the alliance.
                        const target = allianceQuery.memberData.find((member) => member.userId === targetId);

                        // if target is undefined, then the target is not a member of the alliance.
                        if (!target) {
                            return {
                                status: 'error',
                                message: 'User specified is not a member of the alliance.',
                            };
                        // if target exists, then we can go ahead and kick the user.
                        } else {
                            // we will do two things:
                            // 1. remove the user from the alliance's memberData array.
                            // 2. remove the alliance's pointer from the user's _p_alliance field.

                            // remove the user from the alliance's memberData array.
                            console.log(targetId);
                            await Alliance.updateOne({ _id: allianceObjId }, { $pull: { memberData: { userId: targetId } } })

                            // remove the alliance's pointer from the target's _p_alliance field.
                            const targetQuery = await User.findOne({ userId: targetId });

                            // if somehow target query doesn't exist, then something went wrong.
                            if (!targetQuery) {
                                return {
                                    status: 'error',
                                    message: 'Unable to remove user from alliance successfully. Please submit a ticket.',
                                };
                            } else {
                                // otherwise, we will go ahead and remove the alliance's pointer from the target's _p_alliance field.
                                targetQuery._p_alliance = undefined;
                                await targetQuery.save();

                                return {
                                    status: 'success',
                                    message: 'User has been kicked from the alliance.',
                                };
                            }
                        }
                    }
                }
            }
        }
    } catch (err) {
        console.log({
            errorFrom: 'kickFromAllianceLogic',
            errorMessage: err.message,
        });
    }
};

/**
 * Removes expired invites from the database. Gets called every 30 minutes.
 */
const removeExpiredInvitesScheduler = async () => {
    try {
        cron.schedule('*/30 * * * *', async () => {
            // we query through the PendingInvites database and search for any expired invites.
            const PendingAllianceInvite = mongoose.model('PendingAllianceInviteData', AlliancePendingInviteSchema, 'RHDiscordPendingAllianceInvites');
            const pendingInvitesQuery = await PendingAllianceInvite.find();

            // if there are no pending invites, we will not do anything.
            if (!pendingInvitesQuery) {
                return;
            // otherwise, we query through each and check for any expired ones.
            } else {
                for (let i = 0; i < pendingInvitesQuery.length; i++) {
                    const invite = pendingInvitesQuery[i];

                    // get the current unix timestamp
                    const now = Math.floor(new Date().getTime() / 1000);
                    // if the invite has expired, we will remove it from the database.
                    if (invite.inviteExpiryTimestamp < now) {
                        await PendingAllianceInvite.deleteOne({ _id: invite._id });
                    }
                }
            }
        });
    } catch (err) {
        console.log({
            errorFrom: 'removeExpiredInvitesScheduler',
            errorMessage: err.message,
        });
    }
};

module.exports = {
    createAllianceLogic,
    pendingAllianceInviteLogic,
    showInviterPendingInvitesLogic,
    showInviteePendingInvitesLogic,
    rescindPendingInviteLogic,
    acceptAllianceInviteLogic,
    declineAllianceInviteLogic,
    disbandAllianceLogic,
    leaveAllianceLogic,
    delegateChiefRoleLogic,
    showAllianceLogic,
    showOwnAllianceLogic,
    kickFromAllianceLogic,
    removeExpiredInvitesScheduler,
};
