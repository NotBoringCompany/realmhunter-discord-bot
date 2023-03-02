require('dotenv').config();
const mongoose = require('mongoose');
const { generateObjectId } = require('../cryptoUtils');
const permissions = require('../dbPermissions');
const { AllianceSchema, DiscordUserSchema } = require('../schemas');

mongoose.connect(process.env.MONGODB_URI);

/**
 * Creates an alliance when called and when the requirements are met.
 */
const createAlliance = async (userId, allianceName) => {
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
                        message: 'Alliance created successfully',
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
        throw err;
    }
};

createAlliance(null, '123');

module.exports = {
    createAlliance,
};
