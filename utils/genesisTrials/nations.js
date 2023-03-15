const mongoose = require('mongoose');
const { cumulativeNationTagsStakedEmbed } = require('../../embeds/genesisTrials/nations');
const { generateObjectId } = require('../cryptoUtils');
const permissions = require('../dbPermissions');
const { DiscordUserSchema, NationsSchema, NationLeadVoteSchema } = require('../schemas');
const { checkJoinDateAndRole } = require('./dailyTags');
const cron = require('node-cron');

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
                    userQuery._updated_at = Date.now();
                    await userQuery.save();

                    return {
                        status: 'success',
                        message: `You have joined Nation ${roleToGive.name}.`,
                    };
                }
            // UPDATE: if they're already in a nation, return a message saying they CANNOT change nations.
            // (UPDATE FROM 12 MARCH. WILL REMOVE AFTER GENESIS TRIALS END.)
            } else {
                return {
                    status: 'error',
                    message: 'You are temporarily not allowed to change nations.',
                };
                // // split the pointer to get the nation name and the object ID.
                // const nationObjId = nationPointer.split('$')[1];
                // const currentNationQuery = await Nation.findOne({ _id: nationObjId });

                // // if the nation isn't found, something went wrong.
                // if (!currentNationQuery) {
                //     return {
                //         status: 'error',
                //         message: 'Nation to add not found. Please submit a ticket.',
                //     };
                // }

                // // if the user is already in the same nation, we return an error.
                // if (currentNationQuery.nation.toLowerCase() === roleToGive.name.toLowerCase()) {
                //     return {
                //         status: 'error',
                //         message: 'You are already in this nation.',
                //     };
                // // otherwise, we do a few things:
                // // 1. remove the user from the current nation (remove from members array)
                // // 2. remove the user's nation pointer from the user's data.
                // // 3. remove the user's current nation role.
                // // 4. add the user to the new nation (add to members array)
                // // 5. add the user's nation pointer to the user's data.
                // // 6. add the user's new nation role.
                // } else {
                //     // remove the user from the current nation.
                //     const currentNationMembers = currentNationQuery.members;
                //     const memberIndex = currentNationMembers.findIndex(m => m.userId === interaction.user.id);
                //     currentNationQuery.members.splice(memberIndex, 1);
                //     await currentNationQuery.save();

                //     // then, we remove the user's nation pointer from the user's data.
                //     userQuery._p_nation = undefined;
                //     userQuery._updated_at = Date.now();
                //     await userQuery.save();

                //     // then, we remove the user's current nation role.
                //     const currentNationRole = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === currentNationQuery.nation.toLowerCase());
                //     await interaction.member.roles.remove(currentNationRole);

                //     // then, we add the user to the new nation.
                //     // first, we check if the nation has members.
                //     const newNationMembers = nationQuery.members;

                //     // if the nation doesn't have members yet, we add the user to the members array.
                //     if (!newNationMembers) {
                //         nationQuery.members = [{
                //             userId: interaction.user.id,
                //             member: 'role',
                //         }];

                //         await nationQuery.save();
                //     // otherwise, we check if the user is already in the list (precautionary measures).
                //     } else {
                //         // if the user is already in the list, we return an error.
                //         if (newNationMembers.find(m => m.userId === interaction.user.id)) {
                //             return {
                //                 status: 'error',
                //                 message: 'You are already in this nation.',
                //             };
                //         // if the user isn't in the list, we add them.
                //         } else {
                //             nationQuery.members.push({
                //                 userId: interaction.user.id,
                //                 member: 'role',
                //             });

                //             await nationQuery.save();
                //         }
                //     }

                //     // once we've added the user to the new nation, we add the user's nation pointer to the user's data.
                //     userQuery._p_nation = `${process.env.NATIONS_DB_NAME}$${nationQuery._id}`;
                //     userQuery._updated_at = Date.now();
                //     await userQuery.save();

                //     // finally, we add the user's new nation role.
                //     await interaction.member.roles.add(roleToGive);

                //     return {
                //         status: 'success',
                //         message: `You have joined Nation ${roleToGive.name}.`,
                //     };
                // }
            }
        }
    } catch (err) {
        console.log({
            errorFrom: 'giveNationRole',
            errorMessage: err,
        });
    }
};

/**
 * Buttons for the representative vote embed.
 */
const representativeVoteButtons = () => {
    return [
        {
            type: 2,
            style: 1,
            label: 'Vote Now',
            custom_id: 'nationRepresentativeVoteButton',
        },
        {
            type: 2,
            style: 1,
            label: 'Rescind Vote',
            custom_id: 'nationRepresentativeRescindVoteButton',
        },
        {
            type: 2,
            style: 1,
            label: 'Check votes left',
            custom_id: 'nationRepresentativeCheckVotesLeftButton',
        },
        {
            type: 2,
            style: 1,
            label: 'Check who I voted for',
            custom_id: 'nationRepresentativeCheckVotesButton',
        },
    ];
};

/**
 * Get the nation of the voter who clicked on the button(s).
 */
const getVotersNation = async (userId) => {
    try {
        // we query the user.
        const User = mongoose.model('User', DiscordUserSchema, 'RHDiscordUserData');
        const userQuery = await User.findOne({ userId: userId });

        // if the user doesn't exist, then we assume they don't have a nation anyway.
        // we throw an error.
        if (!userQuery) {
            return {
                status: 'error',
                message: 'You need to be in a nation to vote for a representative.',
                nation: undefined,
            };
        // if the user does exist, we check if they have a nation pointer.
        } else {
            const nationPointer = userQuery._p_nation;

            // if they don't have a nation pointer, then they're not in a nation. we throw an error.
            if (!nationPointer) {
                return {
                    status: 'error',
                    message: 'You need to be in a nation to vote for a representative.',
                    nation: undefined,
                };
            // otherwise, we query the nation.
            } else {
                const Nation = mongoose.model('Nation', NationsSchema, 'RHDiscordNationsData');
                // split the pointer to get the obj ID
                const nationObjId = nationPointer.split('$')[1];
                const nationQuery = await Nation.findOne({ _id: nationObjId });

                // if somehow nation can't be found, we throw an error.
                if (!nationQuery) {
                    return {
                        status: 'error',
                        message: 'Nation not found. Please submit a ticket.',
                        nation: undefined,
                    };
                // otherwise, we return the nation's name
                } else {
                    const nationName = nationQuery.nation;

                    // if name is undefined, then something went wrong. we throw an error.
                    if (!nationName) {
                        return {
                            status: 'error',
                            message: 'Nation name not found. Please submit a ticket.',
                            nation: undefined,
                        };
                    } else {
                        return {
                            status: 'success',
                            message: 'Nation found.',
                            nation: nationName,
                        };
                    }
                }
            }
        }
    } catch (err) {
        console.log({
            errorFrom: 'getVotersNation',
            errorMessage: err,
        });
    }
};

/**
 * Gets how many votes the voter has available raw (i.e. not including the votes they've already casted)
 * Based on if they have the GPW role, joined before 1 Jan 2023 00:00 GMT or have a server booster role.
 */
const getVotesAvailableRaw = (interaction) => {
    try {
        let votesAvailable = 0;

        // first, we do a few checks.
        const { joinDate, hasWLRole, hasServerBoosterRole } = checkJoinDateAndRole(interaction);

        // if the user has the WL role, they have 4 base votes.
        if (hasWLRole) {
            votesAvailable = 4;
        // if the user joined before the date requirement, they have 4 base votes.
        } else if (joinDate <= process.env.JOIN_DATE_REQUIREMENT) {
            votesAvailable = 4;
        // otherwise, they have 2 base votes.
        } else {
            votesAvailable = 2;
        }

        // now, we check if they are a Server Booster. if they are, they get an additional 1 vote.
        if (hasServerBoosterRole) {
            votesAvailable += 1;
        }

        return votesAvailable;
    } catch (err) {
        console.log({
            errorFrom: 'getVotesAvailableRaw',
            errorMessage: err,
        });
    }
};

/**
 * Get how many votes the voter has left. This includes the amount of votes available raw minus the amount of votes they've already casted.
 */
const getCurrentVotesAvailable = async (interaction) => {
    try {
        const votesAvailableRaw = getVotesAvailableRaw(interaction);

        // if there's an error getting the votes available raw, we throw an error.
        if (!votesAvailableRaw) {
            return {
                status: 'error',
                message: 'Error getting votes available.',
            };
        // otherwise, we now check how many votes they've already casted.
        } else {
            const Votes = mongoose.model('Votes', NationLeadVoteSchema, 'RHDiscordNationLeadVotes');
            const votesQuery = await Votes.findOne({ voterId: interaction.user.id });

            // if they haven't casted any votes, we return the amount of votes available raw.
            if (!votesQuery) {
                return {
                    status: 'success',
                    message: `You have ${votesAvailableRaw} votes available.`,
                };
            // otherwise, we check how many votes they've casted by checking the array's length.
            } else {
                const nomineesVotedLength = votesQuery.nomineesVoted.length;

                const votesAvailable = votesAvailableRaw - nomineesVotedLength;

                // if they have no votes left, we let them know.
                // sometimes, this can be less than 0 if they were a server booster and no longer are.
                // just to make sure, we put <= 0.
                if (votesAvailable <= 0) {
                    return {
                        status: 'error',
                        message: 'You have no votes left.',
                    };
                } else {
                    return {
                        status: 'success',
                        message: `You still have ${votesAvailable} votes available.`,
                    };
                }
            }
        }
    } catch (err) {
        console.log({
            errorFrom: 'getCurrentVotesAvailable',
            errorMessage: err,
        });
    }
};

/**
 * Submits a vote for a nominee.
 */
const submitVote = async (interaction, nomineeId) => {
    try {
        // at this point, the user should already have a nation from the previous check.
        // we query the vote database.
        const Votes = mongoose.model('Votes', NationLeadVoteSchema, 'RHDiscordNationLeadVotes');
        const votesQuery = await Votes.findOne({ voterId: interaction.user.id });

        // since the user should already have a nation, we query the user's nation via RHDiscordUserData.
        const User = mongoose.model('User', DiscordUserSchema, 'RHDiscordUserData');
        const userQuery = await User.findOne({ userId: interaction.user.id });

        // if the user doesn't exist, we throw an error.
        if (!userQuery) {
            return {
                status: 'error',
                message: 'User not found in database. Please submit a ticket.',
            };
        }

        // we get the nation pointer.
        const nationPointer = userQuery._p_nation;

        // we check if the user's nation is part of a union.
        const Nation = mongoose.model('Nation', NationsSchema, 'RHDiscordNationsData');

        // if the nation pointer is undefined, we throw an error.
        if (!nationPointer) {
            return {
                status: 'error',
                message: 'You are not in a nation. Please join a nation before voting.',
            };
        }

        // split to get the nation's object ID
        const nationObjId = nationPointer.split('$')[1];
        const nationQuery = await Nation.findOne({ _id: nationObjId });

        if (!nationQuery) {
            return {
                status: 'error',
                message: 'Nation not found in database. Please submit a ticket.',
            };
        }

        // we now check if the nominee is in the same nation as the voter.
        const nomineeQuery = await User.findOne({ userId: nomineeId });

        // if the nominee doesn't exist, we throw an error.
        if (!nomineeQuery) {
            return {
                status: 'error',
                message: 'Nominee not found.',
            };
        }

        // we get the nominee's nation pointer.
        const nomineeNationPointer = nomineeQuery._p_nation;

        // if the nominee's nation pointer is undefined, we throw an error.
        if (!nomineeNationPointer) {
            return {
                status: 'error',
                message: 'Nominee is not in a nation.',
            };
        }

        // split to get the nation's object ID
        const nomineeNationObjId = nomineeNationPointer.split('$')[1];
        const nomineeNationQuery = await Nation.findOne({ _id: nomineeNationObjId });

        // if the nominee is not in the same nation as the voter, we throw an error.
        // check if user's nation and nominee's nation is in a union.
        const union = nationQuery.union;
        const nomineeUnion = nomineeNationQuery.union;

        if (union) {
            // if union exists for user's nation, check if nominee's nation is in the same union.
            if (nomineeUnion !== union) {
                return {
                    status: 'error',
                    message: 'Nominee is not in your union.',
                };
            }
        // if union doesn't exist, check if nominee's nation is the same as user's nation.
        } else {
            if (nomineeNationPointer !== nationPointer) {
                return {
                    status: 'error',
                    message: 'Nominee is not in your nation.',
                };
            }
        }

        // if the voter doesn't exist, we create a new document for them.
        if (!votesQuery) {
            const { _wperm, _rperm, _acl } = permissions(true, false);
            const NewVote = new Votes(
                {
                    _id: generateObjectId(),
                    _created_at: Date.now(),
                    _updated_at: Date.now(),
                    _wperm: _wperm,
                    _rperm: _rperm,
                    _acl: _acl,
                    voterId: interaction.user.id,
                    _p_nation: nationPointer,
                    nomineesVoted: [nomineeId],
                },
            );

            await NewVote.save();

            return {
                status: 'success',
                message: 'Vote submitted. Thank you!',
            };
        // otherwise, we check if the users still have enough votes left.
        } else {
            // this should already be checked beforehand, but just as an extra precaution.
            const votesLeft = await getCurrentVotesAvailable(interaction);

            // if the user has no votes left, we throw an error.
            if (votesLeft.status === 'error') {
                return {
                    status: 'error',
                    message: votesLeft.message,
                };
            } else {
                // otherwise, we add the nominee to the array.
                votesQuery.nomineesVoted.push(nomineeId);

                await votesQuery.save();

                return {
                    status: 'success',
                    message: 'Vote submitted. Thank you!',
                };
            }
        }
    } catch (err) {
        console.log({
            errorFrom: 'submitVote',
            errorMessage: err,
        });
    }
};

/**
 * Rescinds a vote for a nominee.
 */
const rescindVote = async (interaction, nomineeId) => {
    try {
        // first, we check if the user exists in the Votes database.
        const Votes = mongoose.model('Votes', NationLeadVoteSchema, 'RHDiscordNationLeadVotes');
        const votesQuery = await Votes.findOne({ voterId: interaction.user.id });

        // if the user doesn't exist, we throw an error.
        if (!votesQuery) {
            return {
                status: 'error',
                message: 'You have not voted for anyone.',
            };
        }

        // we get the index of the nomineeId from the `nomineesVoted` array.
        const nomineeIndex = votesQuery.nomineesVoted.indexOf(nomineeId);

        // if the nomineeId is not in the array, we throw an error.
        if (nomineeIndex === -1) {
            return {
                status: 'error',
                message: 'You have not voted for this nominee.',
            };
        }

        // otherwise, we remove the nomineeId from the array.
        votesQuery.nomineesVoted.splice(nomineeIndex, 1);

        await votesQuery.save();

        return {
            status: 'success',
            message: 'Vote rescinded.',
        };
    } catch (err) {
        console.log({
            errorFrom: 'rescindVote',
            errorMessage: err,
        });
    }
};

/**
 * Gets all of the voter's nominees as a single string.
 */
const checkVotersNominees = async (voterId) => {
    try {
        const Votes = mongoose.model('Votes', NationLeadVoteSchema, 'RHDiscordNationLeadVotes');
        const votesQuery = await Votes.findOne({ voterId: voterId });

        let nominees = 'You have voted for: \n';

        if (!votesQuery) {
            return {
                status: 'error',
                message: 'You have not voted for anyone.',
            };
        }

        // we get the array of nominees.
        const nomineesVoted = votesQuery.nomineesVoted;

        for (let i = 0; i < nomineesVoted.length; i++) {
            const nomineeId = nomineesVoted[i];

            nominees += `<@${nomineeId}> \n`;
        }

        if (nominees === 'You have voted for: \n') {
            return {
                status: 'error',
                message: 'You have not voted for anyone.',
            };
        }

        return {
            status: 'success',
            message: nominees,
        };
    } catch (err) {
        console.log({
            errorFrom: 'checkVotersNominees',
            errorMessage: err,
        });
    }
};

/**
 * Gets all vote results for all nominees.
 */
const getVoteResults = async () => {
    try {
        // get the vote database
        const Votes = mongoose.model('Votes', NationLeadVoteSchema, 'RHDiscordNationLeadVotes');
        const votesQuery = await Votes.find();

        // if there's an error getting votes, we throw an error.
        if (!votesQuery) {
            return {
                status: 'error',
                message: 'Error getting votes.',
            };
        // else, we get the 'nomineesVoted' array from each votesQuery.
        } else {
            const nomineesData = [];
            // we want to get the nomineesVoted array from each votesQuery and add it to the nomineesData array.
            // if the participant doesn't exist yet, we add it to the array with their userId and their voteTotal.
            // if the participant does exist, we add 1 to their voteTotal.
            for (let i = 0; i < votesQuery.length; i++) {
                const nomineesVoted = votesQuery[i].nomineesVoted;
                for (let j = 0; j < nomineesVoted.length; j++) {
                    const nominee = nomineesVoted[j];
                    const participantExists = nomineesData.find((participant) => participant.userId === nominee);
                    if (!participantExists) {
                        nomineesData.push({
                            userId: nominee,
                            voteTotal: 1,
                        });
                    } else {
                        participantExists.voteTotal++;
                    }
                }
            }

            // sort it from highest votes to lowest votes.
            nomineesData.sort((a, b) => b.voteTotal - a.voteTotal);
            
            // we now query the user's data and check their nation for each nominee.
            const User = mongoose.model('User', DiscordUserSchema, 'RHDiscordUserData');
            const Nation = mongoose.model('Nation', NationsSchema, 'RHDiscordNationsData');

            for (let i = 0; i < nomineesData.length; i++) {
                const userQuery = await User.findOne({ userId: nomineesData[i].userId });

                if (userQuery) {
                    const nationPointer = userQuery._p_nation;

                    if (nationPointer) {
                        // split the pointer to get the nation's object ID.
                        const nationObjId = nationPointer.split('$')[1];
                        const nationQuery = await Nation.findOne({ _id: nationObjId });

                        if (nationQuery) {
                            nomineesData[i].nation = nationQuery.nation;
                            if (nationQuery.union) {
                                nomineesData[i].union = nationQuery.union;
                            }
                        }
                    }
                }
            }

            console.log(nomineesData);
        }
    } catch (err) {
        console.log({
            errorFrom: 'getVoteResults',
            errorMessage: err,
        });
    }
};

/**
 * Stakes tags for your nation.
 */
const stakeTags = async (userId, stakeAmount) => {
    try {
        if (isNaN(stakeAmount)) {
            return {
                status: 'error',
                message: 'Please enter a valid number.',
            };
        }

        if (stakeAmount < 1) {
            return {
                status: 'error',
                message: 'You cannot stake less than 1 cookie.',
            };
        }

        // first, we check if the user exists.
        const User = mongoose.model('User', DiscordUserSchema, 'RHDiscordUserData');
        const userQuery = await User.findOne({ userId: userId });

        // if the user doesn't exist, then they're not in a nation and can't stake anyway.
        if (!userQuery) {
            return {
                status: 'error',
                message: 'You are not in a nation. You cannot stake.',
            };
        // otherwise, we check if the user has a nation.
        } else {
            const nationPointer = userQuery._p_nation;

            // if they're not in a nation, they can't stake.
            if (!nationPointer) {
                return {
                    status: 'error',
                    message: 'You are not in a nation. You cannot stake.',
                };
            // otherwise, we query the nation via the pointer.
            } else {
                const Nation = mongoose.model('Nation', NationsSchema, 'RHDiscordNationsData');
                // split the pointer to get the nation's object ID.
                const nationObjId = nationPointer.split('$')[1];
                const nationQuery = await Nation.findOne({ _id: nationObjId });

                // if nation doesn't exist, then throw an error.
                if (!nationQuery) {
                    return {
                        status: 'error',
                        message: 'Error while finding nation. Please submit a ticket.',
                    };
                // otherwise, we first of all check if the nation contains the user via the `members` array.
                } else {
                    // we check if the user data already exists in the `stakedTags` array.
                    const stakedTags = nationQuery.stakedTags;
                    const userStaked = stakedTags.find((data) => data.userId === userId);

                    // we also check if the user has enough tags to stake `stakeAmount`.
                    const checkTagsAmount = userQuery.hunterTags;

                    // if the user doesn't have enough tags, we throw an error.
                    if (checkTagsAmount < stakeAmount) {
                        return {
                            status: 'error',
                            message: 'You do not have enough cookies to stake.',
                        };
                    }

                    // if user hasn't staked, we add them to the array.
                    if (!userStaked) {
                        nationQuery.stakedTags.push({
                            userId: userId,
                            stakeAmount: stakeAmount,
                        });
                        nationQuery._updated_at = Date.now();
                        await nationQuery.save();

                        return {
                            status: 'success',
                            message: `Successfully staked ${stakeAmount} cookies.`,
                        };
                    } else {
                        // otherwise, we use `updateOne` to add the stake amount to the user's existing data.
                        await Nation.updateOne({ _id: nationObjId, 'stakedTags.userId': userId }, { $set: { 'stakedTags.$.stakeAmount': userStaked.stakeAmount + stakeAmount } });

                        // remove the tags from the user's account.
                        userQuery.hunterTags -= stakeAmount;
                        // add `true` to the doubleTagEligibility if now is before 15 March 14:00 GMT
                        const now = Math.floor(new Date().getTime() / 1000);

                        if (now < process.env.UNSTAKE_LOSE_ELIGIBILITY_TIMESTAMP) {
                            userQuery.doubleTagEligibility = true;
                        }
                        userQuery._updated_at = Date.now();

                        await userQuery.save();

                        return {
                            status: 'success',
                            message: `Successfully staked ${stakeAmount} cookies.`,
                        };
                    }
                }
            }
        }
    } catch (err) {
        console.log({
            errorFrom: 'stakeTags',
            errorMessage: err,
        });
    }
};

/**
 * Buttons to stake and unstake tags.
 */
const stakeTagsButtons = () => {
    return [
        {
            type: 2,
            style: 1,
            label: 'Stake cookies',
            custom_id: 'stakeNationTagsButton',
        },
        {
            type: 2,
            style: 1,
            label: 'Unstake cookies',
            custom_id: 'unstakeNationTagsButton',
        },
        {
            type: 2,
            style: 1,
            label: 'Check cookies staked amount',
            custom_id: 'checkStakedNationTagsButton',
        },
    ];
};

/**
 * Unstakes staked tags for your nation.
 */
const unstakeTags = async (userId, unstakeAmount) => {
    try {
        if (isNaN(unstakeAmount)) {
            return {
                status: 'error',
                message: 'Please enter a valid number.',
            };
        }

        if (unstakeAmount < 1) {
            return {
                status: 'error',
                message: 'You cannot unstake less than 1 cookie.',
            };
        }

        // first we check if the user exists.
        const User = mongoose.model('User', DiscordUserSchema, 'RHDiscordUserData');
        const userQuery = await User.findOne({ userId: userId });

        // if the user doesn't exist, then they're not in a nation and can't unstake anyway.
        if (!userQuery) {
            return {
                status: 'error',
                message: 'You are not in a nation. You have nothing to unstake.',
            };
        // otherwise, we check if the user has a nation.
        } else {
            const nationPointer = userQuery._p_nation;

            // if they're not in a nation, they can't unstake.
            if (!nationPointer) {
                return {
                    status: 'error',
                    message: 'You are not in a nation. You have nothing to unstake.',
                };
            // otherwise, we query the nation via the pointer.
            } else {
                const Nation = mongoose.model('Nation', NationsSchema, 'RHDiscordNationsData');
                // split the pointer to get the nation's object ID.
                const nationObjId = nationPointer.split('$')[1];
                const nationQuery = await Nation.findOne({ _id: nationObjId });

                // if nation doesnt exist, something is wrong, throw an error.
                if (!nationQuery) {
                    return {
                        status: 'error',
                        message: 'Error while finding nation. Please submit a ticket.',
                    };
                // otherwise, we check if `stakedTags` contains the user.
                } else {
                    const stakedTags = nationQuery.stakedTags;

                    // we check if the user data already exists in the `stakedTags` array.
                    const userStaked = stakedTags.find((data) => data.userId === userId);

                    // if the user hasn't staked anything, we throw an error.
                    if (!userStaked) {
                        return {
                            status: 'error',
                            message: 'You have not staked anything.',
                        };
                    // otherwise, we check if the user has enough staked to unstake `unstakeAmount`.
                    } else {
                        const checkStakedAmount = userStaked.stakeAmount;

                        // if they are trying to unstake more than they have staked, we throw an error.
                        if (checkStakedAmount - unstakeAmount < 0) {
                            return {
                                status: 'error',
                                message: 'You cannot unstake more than you have currently staked.',
                            };
                        } else {
                            // otherwise, we use `updateOne` to remove the stake amount from the user's existing data.
                            await Nation.updateOne({ _id: nationObjId, 'stakedTags.userId': userId }, { $set: { 'stakedTags.$.stakeAmount': userStaked.stakeAmount - unstakeAmount } });

                            // add the tags to the user's account.
                            userQuery.hunterTags += unstakeAmount;
                            userQuery._updated_at = Date.now();

                            const now = Math.floor(new Date().getTime() / 1000);

                            // after 15 March 14:00 GMT, users who unstake will lose their doubleTagEligibility.
                            if (now > process.env.UNSTAKE_LOSE_ELIGIBILITY_TIMESTAMP) {
                                userQuery.doubleTagEligibility = false;
                            }

                            await userQuery.save();

                            return {
                                status: 'success',
                                message: `Successfully unstaked ${unstakeAmount} cookies.`,
                            };
                        }
                    }
                }
            }
        }
    } catch (err) {
        console.log({
            errorFrom: 'unstakeTags',
            errorMessage: err,
        });
    }
};

/**
 * Gets the current amount of tags staked for a nation.
 */
const getCurrentTagsStaked = async (userId) => {
    try {
        // we check if the user exists
        const User = mongoose.model('User', DiscordUserSchema, 'RHDiscordUserData');
        const userQuery = await User.findOne({ userId: userId });

        // if user doesn't exist, we throw an error.
        if (!userQuery) {
            return {
                status: 'error',
                message: 'You have not staked any cookies.',
            };
        // otherwise, we get their nation pointer.
        } else {
            const nationPointer = userQuery._p_nation;

            // if no nation pointer, throw an error.
            if (!nationPointer) {
                return {
                    status: 'error',
                    message: 'You have not staked any cookies.',
                };
            // otherwise, we query the nation via the pointer.
            } else {
                const Nation = mongoose.model('Nation', NationsSchema, 'RHDiscordNationsData');
                // split the pointer to get the nation's object ID.
                const nationObjId = nationPointer.split('$')[1];
                const nationQuery = await Nation.findOne({ _id: nationObjId });

                // if nation doesnt exist, something is wrong, throw an error.
                if (!nationQuery) {
                    return {
                        status: 'error',
                        message: 'Error while finding nation. Please submit a ticket.',
                    };
                // otherwise, we get the staked tags.
                } else {
                    const stakedTags = nationQuery.stakedTags;
                    // we find the user
                    const userStaked = stakedTags.find((data) => data.userId === userId);

                    if (!userStaked) {
                        return {
                            status: 'error',
                            message: 'You have not staked any cookies.',
                        };
                    } else {
                        if (!userStaked.stakeAmount) {
                            return {
                                status: 'error',
                                message: 'You have not staked any cookies.',
                            };
                        } else {
                            return {
                                status: 'success',
                                message: `You have staked ${userStaked.stakeAmount} cookies.`,
                            };
                        }
                    }
                }
            }
        }
    } catch (err) {
        console.log({
            errorFrom: 'getCurrentTagsStaked',
            errorMessage: err,
        });
    }
};

/**
 * Gets the cumulative amount of tags staked for ALL nations and unions.
 */
const getNationCumulativeTagsStakedLogic = async () => {
    try {
        const Nation = mongoose.model('Nation', NationsSchema, 'RHDiscordNationsData');

        const unions = ['NaN', 'Union A', 'Union B', 'Union C', 'Union D'];

        const leaderboard = [];

        for (let i = 0; i < unions.length; i++) {
            // if union is 'NaN', get all nations that don't have a union (i.e. union === undefined)
            if (unions[i] === 'NaN') {
                const nationsQuery = await Nation.find({ union: { $exists: false } });
                // loop through each nation and add the total staked tags to the leaderboard.
                for (let j = 0; j < nationsQuery.length; j++) {
                    const nation = nationsQuery[j].nation;
                    const stakedTags = nationsQuery[j].stakedTags;

                    let totalStaked = 0;

                    if (stakedTags && stakedTags.length > 0) {
                        for (let k = 0; k < stakedTags.length; k++) {
                            totalStaked += stakedTags[k].stakeAmount;
                        }
                    }

                    leaderboard.push({
                        name: nation,
                        value: totalStaked.toString(),
                    });
                }
            // if they're part of a union, we get all nations that are part of that union.
            // we then add the total staked tags from ALL the nations within that union to the leaderboard.
            } else {
                const nationsQuery = await Nation.find({ union: unions[i] });

                let totalStaked = 0;
                // loop through each nation and add the total staked tags to the leaderboard.
                for (let j = 0; j < nationsQuery.length; j++) {
                    const stakedTags = nationsQuery[j].stakedTags;

                    if (stakedTags && stakedTags.length > 0) {
                        for (let k = 0; k < stakedTags.length; k++) {
                            totalStaked += stakedTags[k].stakeAmount;
                        }
                    }
                }

                leaderboard.push({
                    name: unions[i],
                    value: totalStaked.toString(),
                });
            }
        }

        return {
            embed: cumulativeNationTagsStakedEmbed(leaderboard),
            status: 'success',
            message: 'Successfully retrieved cumulative tags staked.',
        };
    } catch (err) {
        console.log({
            errorFrom: 'getNationCumulativeTagsStakedLogic',
            errorMessage: err,
        });
    }
};

/**
 * Shows the cumulative amount of tags staked for ALL nations and unions.
 */
const showCumulativeNationTagsStaked = async () => {
    try {
        return await getNationCumulativeTagsStakedLogic();
    } catch (err) {
        console.log({
            errorFrom: 'showCumulativeNationTagsStaked',
            errorMessage: err,
        });
    }
};

/**
 * Scheduler to update the cumulative tags staked for nations and unions every 10 minutes.
 */
const cumulativeNationTagsStakedScheduler = async (msgId, client) => {
    try {
        cron.schedule('*/10 * * * *', async () => {
            console.log('editing cumulative tags staked embed');

            const stakingLeaderboardChannel = await client.channels.fetch(process.env.CUMULATIVE_COOKIES_STAKED_EMBED_CHANNELID);
            const stakingLeaderboardMsg = await stakingLeaderboardChannel.messages.fetch(msgId);

            const { embed } = await showCumulativeNationTagsStaked();

            await stakingLeaderboardMsg.edit({ embeds: [embed] });
        });
    } catch (err) {
        console.log({
            errorFrom: 'cumulativeNationTagsStakedScheduler',
            errorMessage: err,
        });
    }
};

/**
 * Sends a nation that won a challenge some pending tags.
 */
const sendPendingNationTagsLogic = async (nationName, tagsToAdd, challenge) => {
    try {
        const Nation = mongoose.model('Nation', NationsSchema, 'RHDiscordNationsData');
        const nationQuery = await Nation.findOne({ nation: nationName });

        // if nation doesnt exist, throw an error.
        if (!nationQuery) {
            return {
                status: 'error',
                message: 'Nation not found. Please make the nation is typed correctly.',
                winMessage: undefined,
            };
        // otherwise, add the tags to `pendingTagsEarned`.
        } else {
            if (!nationQuery.pendingTagsEarned) {
                nationQuery.pendingTagsEarned = parseInt(tagsToAdd);
            } else {
                nationQuery.pendingTagsEarned += parseInt(tagsToAdd);
            }

            if (!nationQuery.tagsEarned) {
                nationQuery.tagsEarned = parseInt(tagsToAdd);
            } else {
                nationQuery.tagsEarned += parseInt(tagsToAdd);
            }

            await nationQuery.save();

            return {
                status: 'success',
                message: `${nationName} has been awarded ${tagsToAdd} cookies.`,
                winMessage: `${nationName} has won the ${challenge} challenge and has been awarded ${tagsToAdd} cookies.`,
            };
        }
    } catch (err) {
        console.log({
            errorFrom: 'sendPendingNationTagsLogic',
            errorMessage: err,
        });
    }
};

/**
 * Buttons to stake and unstake tags.
 */
const distributeNationPendingTagsButtons = () => {
    return [
        {
            type: 2,
            style: 1,
            label: 'Distribute Now',
            custom_id: 'distributeNationPendingTagsButton',
        },
        {
            type: 2,
            style: 1,
            label: 'Check pending cookies earned',
            custom_id: 'checkNationPendingTagsButton',
        },
        {
            type: 2,
            style: 1,
            label: 'Check members staked amount',
            custom_id: 'checkNationMembersStakeAmountButton',
        },
    ];
};

/**
 * Checks how many pending tags a nation/union has earned from winning challenges.
 */
const checkNationPendingTags = async (interaction) => {
    try {
        const User = mongoose.model('User', DiscordUserSchema, 'RHDiscordUserData');
        const userQuery = await User.findOne({ userId: interaction.user.id });

        let pendingTags = 0;

        if (!userQuery) {
            return {
                status: 'error',
                message: 'User not found on database.',
            };
        } else {
            // get the nation pointer
            const nationPointer = userQuery._p_nation;

            if (!nationPointer) {
                return {
                    status: 'error',
                    message: 'You are not part of a nation.',
                };
            }
            // get the nation of the user
            const Nation = mongoose.model('Nation', NationsSchema, 'RHDiscordNationsData');
            // get the nation's obj ID by splitting.
            const nationObjId = nationPointer.split('$')[1];
            const nationQuery = await Nation.findOne({ _id: nationObjId });

            if (!nationQuery) {
                return {
                    status: 'error',
                    message: 'Nation not found on database.',
                };
            } else {
                // check if the nation is part of a union.
                if (nationQuery.union) {
                    // get ALL the pending tags earned by the union.
                    const nationsQuery = await Nation.find({ union: nationQuery.union });
                    for (let i = 0; i < nationsQuery.length; i++) {
                        if (nationsQuery[i].pendingTagsEarned) {
                            pendingTags += nationsQuery[i].pendingTagsEarned;
                        }
                    }
                } else {
                    // get the pending tags earned by the nation.
                    if (nationQuery.pendingTagsEarned) {
                        pendingTags = nationQuery.pendingTagsEarned;
                    }
                }
            }
        }

        return {
            status: 'success',
            message: `Your nation/union has ${pendingTags} pending cookies.`,
            pendingCookies: pendingTags,
        };
    } catch (err) {
        console.log({
            errorFrom: 'checkNationPendingTags',
            errorMessage: err,
        });
    }
};

/**
 * Distributes pending tags to a member. Only callable by the representative of each nation/union.
 */
const distributePendingTagsToMember = async (interaction, userToGiveId, tagsToDistribute) => {
    try {
        const User = mongoose.model('User', DiscordUserSchema, 'RHDiscordUserData');
        const userQuery = await User.findOne({ userId: userToGiveId });

        if (!userQuery) {
            return {
                status: 'error',
                message: 'Please require the user to collect daily cookies first to exist on the database.',
            };
        } else {
            // check if the nation/union of the rewarder has enough pending tags to distribute.
            const { pendingCookies: nationPendingTagsEarned } = await checkNationPendingTags(interaction);

            if (nationPendingTagsEarned < parseInt(tagsToDistribute)) {
                return {
                    status: 'error',
                    message: 'Your nation/union does not have enough pending cookies to distribute.',
                };
            } else {
                // get the nation of the interaction user
                const rewarderQuery = await User.findOne({ userId: interaction.user.id });

                if (!rewarderQuery) {
                    return {
                        status: 'error',
                        message: 'Error while retrieving rewarder data.',
                    };
                } else {
                    // get the nation pointer
                    const rewarderNationPointer = rewarderQuery._p_nation;
                    const Nation = mongoose.model('Nation', NationsSchema, 'RHDiscordNationsData');
                    // get the nation's obj ID by splitting.
                    const rewarderNationObjId = rewarderNationPointer.split('$')[1];
                    const nationQuery = await Nation.findOne({ _id: rewarderNationObjId });

                    if (!nationQuery) {
                        return {
                            status: 'error',
                            message: 'Error while retrieving nation data.',
                        };
                    } else {
                        // we do two things:
                        // 1. reduce the pending tags earned by the nation/union by `tagsToDistribute`.
                        // 2. add `tagsToDistribute` to the user's `hunterTags`.
                        nationQuery.pendingTagsEarned -= parseInt(tagsToDistribute);
                        nationQuery._updated_at = Date.now();

                        await nationQuery.save();

                        if (userQuery.hunterTags) {
                            userQuery.hunterTags += parseInt(tagsToDistribute);
                        } else {
                            userQuery.hunterTags = parseInt(tagsToDistribute);
                        }
                        userQuery._updated_at = Date.now();
                        await userQuery.save();

                        return {
                            status: 'success',
                            message: `Successfully distributed ${tagsToDistribute} pending cookies to <@${userToGiveId}>.`,
                        };
                    }
                }
            }
        }
    } catch (err) {
        console.log({
            errorFrom: 'distributePendingTagsToMember',
            errorMessage: err,
        });
    }
};

/**
 * Gets the cumulative tags staked by the interaction user's nation.
 */
const getAllNationMembersStakingLogic = async (interaction) => {
    try {
        // we get the user's data
        const User = mongoose.model('User', DiscordUserSchema, 'RHDiscordUserData');
        const userQuery = await User.findOne({ userId: interaction.user.id });

        let stakedData = '';

        if (!userQuery) {
            return {
                status: 'error',
                message: 'Error while finding your data in the userbase. Error. Please report to the devs.',
            };
        // if user is found, we get the nation.
        } else {
            const nationPointer = userQuery._p_nation;

            if (!nationPointer) {
                return {
                    status: 'error',
                    message: 'You are not part of a nation. Error. Please report to the devs.',
                };
            }

            // query the nation
            const Nation = mongoose.model('Nation', NationsSchema, 'RHDiscordNationsData');
            // get the nation's obj ID by splitting.
            const nationObjId = nationPointer.split('$')[1];
            const nationQuery = await Nation.findOne({ _id: nationObjId });

            if (!nationQuery) {
                return {
                    status: 'error',
                    message: 'Nation not found on database. Error. Please report to the devs.',
                };
            }

            // check if the nation is part of a union.
            const union = nationQuery.union;

            // if they're not part of a union, get all the members of the nation and how much they're staking each.
            if (!union) {
                // query the `stakedTags` array and get the members and their staked tags.
                const stakedTags = nationQuery.stakedTags;

                if (stakedTags.length > 0) {
                    for (let i = 0; i < stakedTags.length; i++) {
                        const userId = stakedTags[i].userId;
                        const stakeAmount = stakedTags[i].stakeAmount;

                        if (stakeAmount > 0) {
                            stakedData += `<@${userId}>: ${stakeAmount}\n`;
                        }
                    }
                }
            // if they are part of a union, get all the members of the union and how much they're staking each.
            } else {
                // query the union
                const unionQuery = await Nation.find({ union: union });

                // for each nation in the union, get the members and their staked tags.
                for (let i = 0; i < unionQuery.length; i++) {
                    const stakedTags = unionQuery[i].stakedTags;

                    if (stakedTags.length > 0) {
                        for (let j = 0; j < stakedTags.length; j++) {
                            const userId = stakedTags[j].userId;
                            const stakeAmount = stakedTags[j].stakeAmount;

                            if (stakeAmount > 0) {
                                stakedData += `<@${userId}>: ${stakeAmount}\n`;
                            }
                        }
                    }
                }
            }
        }

        return {
            status: 'success',
            message: 'Successfully retrieved your nation/union\'s staked tags data.',
            stakedData: stakedData,
        };
    } catch (err) {
        console.log({
            errorFrom: 'getAllNationMembersStakingLogic',
            errorMessage: err,
        });
    }
};

module.exports = {
    nationRoles,
    giveNationRole,
    nationTemplate,
    representativeVoteButtons,
    getVotersNation,
    getVotesAvailableRaw,
    getCurrentVotesAvailable,
    submitVote,
    rescindVote,
    checkVotersNominees,
    stakeTags,
    stakeTagsButtons,
    unstakeTags,
    getCurrentTagsStaked,
    getNationCumulativeTagsStakedLogic,
    showCumulativeNationTagsStaked,
    cumulativeNationTagsStakedScheduler,
    sendPendingNationTagsLogic,
    distributeNationPendingTagsButtons,
    checkNationPendingTags,
    distributePendingTagsToMember,
    getAllNationMembersStakingLogic,
};
