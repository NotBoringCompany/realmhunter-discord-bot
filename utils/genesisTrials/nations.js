const mongoose = require('mongoose');
const { generateObjectId } = require('../cryptoUtils');
const permissions = require('../dbPermissions');
const { DiscordUserSchema, NationsSchema } = require('../schemas');

/**
 * All currently available nations to choose from (from the poll results).
 */
const nationRoles = () => {
    // we will have to divide them into multiple batches of 5 due to Discord's limitations of 5 buttons per row
    const firstNationsBatch = [
        nationTemplate('China'),
        nationTemplate('Japan'),
        nationTemplate('Indonesia'),
        nationTemplate('Vietnam'),
        nationTemplate('Philippines'),
    ];

    const secondNationsBatch = [
        nationTemplate('Russia'),
        nationTemplate('Germany'),
        nationTemplate('Ukraine'),
        nationTemplate('France'),
        nationTemplate('Serbia'),
    ];

    const thirdNationsBatch = [
        nationTemplate('Pakistan'),
        nationTemplate('India'),
        nationTemplate('Bangladesh'),
        nationTemplate('Korea'),
        nationTemplate('Turkey'),
    ];

    const fourthNationsBatch = [
        nationTemplate('Nigeria'),
        nationTemplate('USA'),
        nationTemplate('Brazil'),
        nationTemplate('Spain'),
        nationTemplate('UK'),
    ];

    const fifthNationsBatch = [
        nationTemplate('Canada'),
        nationTemplate('Malaysia'),
        nationTemplate('Italy'),
        nationTemplate('Thailand'),
    ];

    return {
        firstNationsBatch,
        secondNationsBatch,
        thirdNationsBatch,
        fourthNationsBatch,
        fifthNationsBatch,
    };
};

/**
 * Template for nation roles.
 */
const nationTemplate = (nation) => {
    return {
        type: 2,
        style: 1,
        label: nation,
        custom_id: `${nation.toLowerCase()}NationRoleButton`,
    };
};

/**
 * Gives a user a nation role depending on which one they chose.
 */
const giveNationRole = async (interaction, role) => {
    try {
        let roleToGive;

        switch (role.toLowerCase()) {
            case 'china':
                roleToGive = interaction.guild.roles.cache.find(r => r.id === process.env.CHINA_ROLEID);
                break;
            case 'japan':
                roleToGive = interaction.guild.roles.cache.find(r => r.id === process.env.JAPAN_ROLEID);
                break;
            case 'indonesia':
                roleToGive = interaction.guild.roles.cache.find(r => r.id === process.env.INDONESIA_ROLEID);
                break;
            case 'vietnam':
                roleToGive = interaction.guild.roles.cache.find(r => r.id === process.env.VIETNAM_ROLEID);
                break;
            case 'philippines':
                roleToGive = interaction.guild.roles.cache.find(r => r.id === process.env.PHILIPPINES_ROLEID);
                break;
            case 'russia':
                roleToGive = interaction.guild.roles.cache.find(r => r.id === process.env.RUSSIA_ROLEID);
                break;
            case 'germany':
                roleToGive = interaction.guild.roles.cache.find(r => r.id === process.env.GERMANY_ROLEID);
                break;
            case 'ukraine':
                roleToGive = interaction.guild.roles.cache.find(r => r.id === process.env.UKRAINE_ROLEID);
                break;
            case 'france':
                roleToGive = interaction.guild.roles.cache.find(r => r.id === process.env.FRANCE_ROLEID);
                break;
            case 'serbia':
                roleToGive = interaction.guild.roles.cache.find(r => r.id === process.env.SERBIA_ROLEID);
                break;
            case 'pakistan':
                roleToGive = interaction.guild.roles.cache.find(r => r.id === process.env.PAKISTAN_ROLEID);
                break;
            case 'india':
                roleToGive = interaction.guild.roles.cache.find(r => r.id === process.env.INDIA_ROLEID);
                break;
            case 'bangladesh':
                roleToGive = interaction.guild.roles.cache.find(r => r.id === process.env.BANGLADESH_ROLEID);
                break;
            case 'korea':
                roleToGive = interaction.guild.roles.cache.find(r => r.id === process.env.KOREA_ROLEID);
                break;
            case 'turkey':
                roleToGive = interaction.guild.roles.cache.find(r => r.id === process.env.TURKEY_ROLEID);
                break;
            case 'nigeria':
                roleToGive = interaction.guild.roles.cache.find(r => r.id === process.env.NIGERIA_ROLEID);
                break;
            case 'usa':
                roleToGive = interaction.guild.roles.cache.find(r => r.id === process.env.USA_ROLEID);
                break;
            case 'brazil':
                roleToGive = interaction.guild.roles.cache.find(r => r.id === process.env.BRAZIL_ROLEID);
                break;
            case 'spain':
                roleToGive = interaction.guild.roles.cache.find(r => r.id === process.env.SPAIN_ROLEID);
                break;
            case 'uk':
                roleToGive = interaction.guild.roles.cache.find(r => r.id === process.env.UK_ROLEID);
                break;
            case 'canada':
                roleToGive = interaction.guild.roles.cache.find(r => r.id === process.env.CANADA_ROLEID);
                break;
            case 'malaysia':
                roleToGive = interaction.guild.roles.cache.find(r => r.id === process.env.MALAYSIA_ROLEID);
                break;
            case 'italy':
                roleToGive = interaction.guild.roles.cache.find(r => r.id === process.env.ITALY_ROLEID);
                break;
            case 'thailand':
                roleToGive = interaction.guild.roles.cache.find(r => r.id === process.env.THAILAND_ROLEID);
                break;
        }

        // we first check if the user exists.
        const User = mongoose.model('User', DiscordUserSchema, 'RHDiscordUserData');
        const userQuery = await User.findOne({ userId: interaction.user.id });

        const Nation = mongoose.model('Nation', NationsSchema, 'RHDiscordNationsData');
        const nationQuery = await Nation.findOne({ nation: roleToGive.name });

        console.log(nationQuery);

        // if nation isn't found, something went wrong.
        // we request them to submit a ticket.
        if (!nationQuery) {
            return {
                status: 'error',
                message: 'Nation to give not found. Please submit a ticket.',
            };
        }

        // if user isn't found, we create a new user instance and add the nation.
        if (!userQuery) {
            const { _wperm, _rperm, _acl } = permissions(true, false);

            const NewUser = new User(
                {
                    _id: generateObjectId(),
                    _created_at: Date.now(),
                    _updated_at: Date.now(),
                    _wperm: _wperm,
                    _rperm: _rperm,
                    _acl: _acl,
                    userId: interaction.user.id,
                    hunterTags: 0,
                    realmPoints: 0,
                    dailyTagsClaimed: 0,
                    dailyContributionTagsClaimed: false,
                    contributionTagsEarned: 0,
                    timesDistributionTagsClaimed: 0,
                    _p_nation: `${process.env.NATIONS_DB_NAME}$${nationQuery._id}`,
                },
            );

            // we give the role to the user and then save the user.
            await interaction.member.roles.add(roleToGive);
            await NewUser.save();

            // add the user to the list of members for that nation.
            const members = nationQuery.members;

            // if the nation doesn't have members yet, we just add the user.
            if (!members) {
                nationQuery.members = [{
                    userId: interaction.user.id,
                    member: 'role',
                }];

                await nationQuery.save();
            // if the nation has members, we check if the user is already in the list.
            } else {
                // if the user is already in the list, we return an error.
                if (members.find(m => m.userId === interaction.user.id)) {
                    return {
                        status: 'error',
                        message: 'You are already in this nation.',
                    };
                // if the user isn't in the list, we add them.
                } else {
                    nationQuery.members.push({
                        userId: interaction.user.id,
                        member: 'role',
                    });

                    await nationQuery.save();
                }
            }

            return {
                status: 'success',
                message: `You have joined Nation ${roleToGive.name}.`,
            };
        // if user is found, we check a few things.
        } else {
            // first, we check if the user is already in the nation.
            const nationPointer = userQuery._p_nation;

            // if user has no nation pointer, then they're not part of a nation.
            // we can go ahead and:
            // 1. give the user the role.
            // 2. add the user to the nation's members array.
            // 3. add the nation pointer to the user's data.
            if (!nationPointer) {
                // give user the role.
                await interaction.member.roles.add(roleToGive);

                // add the user to the list of members for that nation.
                const members = nationQuery.members;
                // if the nation doesn't have members yet, we just add the user.
                if (!members) {
                    nationQuery.members = [{
                        userId: interaction.user.id,
                        member: 'role',
                    }];

                    await nationQuery.save();
                // otherwise, we check if the user is already in the list (shouldn't be, but just as a precaution).
                } else {
                    // if the user is already in the list, we return an error.
                    if (members.find(m => m.userId === interaction.user.id)) {
                        return {
                            status: 'error',
                            message: 'You are already in this nation.',
                        };
                    // if the user isn't in the list, we add them.
                    } else {
                        nationQuery.members.push({
                            userId: interaction.user.id,
                            member: 'role',
                        });

                        await nationQuery.save();
                    }

                    // add the nation pointer to the user's data.
                    userQuery._p_nation = `${process.env.NATIONS_DB_NAME}$${nationQuery._id}`;
                    await userQuery.save();

                    return {
                        status: 'success',
                        message: `You have joined Nation ${roleToGive.name}.`,
                    };
                }
            } else {
                // split the pointer to get the nation name and the object ID.
                const nationObjId = nationPointer.split('$')[1];
                const currentNationQuery = await Nation.findOne({ _id: nationObjId });

                // if the nation isn't found, something went wrong.
                if (!currentNationQuery) {
                    return {
                        status: 'error',
                        message: 'Nation to add not found. Please submit a ticket.',
                    };
                }

                // if the user is already in the same nation, we return an error.
                if (currentNationQuery.nation.toLowerCase() === roleToGive.name.toLowerCase()) {
                    return {
                        status: 'error',
                        message: 'You are already in this nation.',
                    };
                // otherwise, we do a few things:
                // 1. remove the user from the current nation (remove from members array)
                // 2. remove the user's nation pointer from the user's data.
                // 3. remove the user's current nation role.
                // 4. add the user to the new nation (add to members array)
                // 5. add the user's nation pointer to the user's data.
                // 6. add the user's new nation role.
                } else {
                    // remove the user from the current nation.
                    const currentNationMembers = currentNationQuery.members;
                    const memberIndex = currentNationMembers.findIndex(m => m.userId === interaction.user.id);
                    currentNationQuery.members.splice(memberIndex, 1);
                    await currentNationQuery.save();

                    // then, we remove the user's nation pointer from the user's data.
                    userQuery._p_nation = undefined;
                    await userQuery.save();

                    // then, we remove the user's current nation role.
                    const currentNationRole = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === currentNationQuery.nation.toLowerCase());
                    await interaction.member.roles.remove(currentNationRole);

                    // then, we add the user to the new nation.
                    // first, we check if the nation has members.
                    const newNationMembers = nationQuery.members;

                    // if the nation doesn't have members yet, we add the user to the members array.
                    if (!newNationMembers) {
                        nationQuery.members = [{
                            userId: interaction.user.id,
                            member: 'role',
                        }];

                        await nationQuery.save();
                    // otherwise, we check if the user is already in the list (precautionary measures).
                    } else {
                        // if the user is already in the list, we return an error.
                        if (newNationMembers.find(m => m.userId === interaction.user.id)) {
                            return {
                                status: 'error',
                                message: 'You are already in this nation.',
                            };
                        // if the user isn't in the list, we add them.
                        } else {
                            nationQuery.members.push({
                                userId: interaction.user.id,
                                member: 'role',
                            });

                            await nationQuery.save();
                        }
                    }

                    // once we've added the user to the new nation, we add the user's nation pointer to the user's data.
                    userQuery._p_nation = `${process.env.NATIONS_DB_NAME}$${nationQuery._id}`;
                    await userQuery.save();

                    // finally, we add the user's new nation role.
                    await interaction.member.roles.add(roleToGive);

                    return {
                        status: 'success',
                        message: `You have joined Nation ${roleToGive.name}.`,
                    };
                }
            }
        }
    } catch (err) {
        console.log({
            errorFrom: 'giveNationRole',
            errorMessage: err,
        });
    }
};

module.exports = {
    nationRoles,
    giveNationRole,
    nationTemplate,
};
