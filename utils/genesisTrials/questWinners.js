require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { QuestEntriesSchema, DiscordUserSchema } = require('../schemas');
const mongoose = require('mongoose');
const permissions = require('../dbPermissions');
const { generateObjectId } = require('../cryptoUtils');

// /**
//  * All winners for the first quest.
//  */
// const firstQuestWinners = JSON.parse(
//     fs.readFileSync(
//         path.join(__dirname, '../../files/questWinners/first-quest-winners.json'),
//     ),
// );

// /**
//  * All entries for the first quest.
//  */
// const firstQuestEntries = JSON.parse(
//     fs.readFileSync(
//         path.join(__dirname, '../../files/questWinners/first-quest-all-entries.json'),
//     ),
// );

// /**
//  * Get the Discord ID of the first quest winner.
//  */
// const getFirstQuestWinners = () => {
//     // get the winners' discord IDs
//     const winnerDiscordIds = [];
//     firstQuestWinners.forEach((winner) => {
//         // if the URL exists.
//         if (winner.Discord) {
//             const getId = getDiscordId(winner);
//             winnerDiscordIds.push(getId);
//         // if the URL doesn't exist, we need to query `firstQuestEntries` to find the other instance of entries that has the Discord ID.
//         } else {
//             const userEmail = winner.Email;
//             const dataWithDiscordId = firstQuestEntries.find((entry) => entry.Email === userEmail && entry.Discord);
//             const getId = getDiscordId(dataWithDiscordId);
//             winnerDiscordIds.push(getId);
//         }
//     });

//     return winnerDiscordIds;
// };

// /**
//  * Get all the Discord IDs of the first quest entries.
//  */
// const getAllFirstQuestEntries = () => {
//     const entriesData = [];

//     const winners = getFirstQuestWinners();

//     firstQuestEntries.forEach((entry) => {
//         // check if discord URL exists, if `entriesData` array doesn't already contain the ID and is not already part of the winners.
//         if (entry.Discord && !entriesData.includes(getDiscordId(entry)) && !winners.includes(getDiscordId(entry))) {
//             entriesData.push(getDiscordId(entry));
//         }
//     });

//     return entriesData;
// };

// /**
//  * Gets the Discord ID from the entry. Only works with our quest entries.
//  */
// const getDiscordId = (data) => {
//     const split = data.Discord.split('@me/')[1];
//     const getSub = split.substring(0, split.indexOf('#'));
//     return getSub;
// };

// /**
//  * Add all the first quest entries and winners to the database.
//  */
// const addAllFirstQuestEntriesAndWinners = async () => {
//     try {
//         const Entries = mongoose.model('QuestEntries', QuestEntriesSchema, 'RHDiscordFirstQuestEntries');

//         const { _wperm, _rperm, _acl } = permissions(true, false);

//         // insert the winners first.
//         const winners = getFirstQuestWinners();
//         await Entries.insertMany(winners.map((winner) => {
//             return {
//                 _id: generateObjectId(),
//                 _created_at: Date.now(),
//                 _updated_at: Date.now(),
//                 _wperm: _wperm,
//                 _rperm: _rperm,
//                 _acl: _acl,
//                 userId: winner,
//                 isWinner: true,
//                 claimed: false,
//             };
//         }));

//         const entries = getAllFirstQuestEntries();
//         await Entries.insertMany(entries.map((entry) => {
//             return {
//                 _id: generateObjectId(),
//                 _created_at: Date.now(),
//                 _updated_at: Date.now(),
//                 _wperm: _wperm,
//                 _rperm: _rperm,
//                 _acl: _acl,
//                 userId: entry,
//                 isWinner: false,
//                 claimed: false,
//             };
//         }));
//     } catch (err) {
//         console.log({
//             errorFrom: 'addAllFirstQuestEntriesAndWinners',
//             errorMessage: err,
//         });
//     }
// };

/**
 * Lets users who entered and who won to claim their tags from the first quest.
 */
const claimFirstQuestTags = async (userId) => {
    try {
        // we first check if the user has entered/won the quest.
        const Entries = mongoose.model('QuestEntries', QuestEntriesSchema, 'RHDiscordFirstQuestEntries');

        const entryQuery = await Entries.findOne({ userId: userId });

        // if the user didn't enter, we throw an error.
        if (!entryQuery) {
            return {
                status: 'error',
                message: 'You did not enter or win this quest. Make sure to join other quests when they\'re available!',
            };
        } else {
            // if the user entered, we will first query the user database.
            const User = mongoose.model('UserData', DiscordUserSchema, 'RHDiscordUserData');
            const userQuery = await User.findOne({ userId: userId });

            // we first check if they're a winner or not.
            const isWinner = entryQuery.isWinner;
            let tagsToClaim;
            // if they're not a winner, they can only claim 5 tags, else if they are a winner they can claim 30.
            if (!isWinner) {
                tagsToClaim = 5;
            } else {
                tagsToClaim = 30;
            }

            // if user isn't found, we create a new entry for them
            if (!userQuery) {
                const { _wperm, _rperm, _acl } = permissions(true, false);

                // we then create a new user entry for them.
                const NewUser = new User(
                    {
                        _id: generateObjectId(),
                        _created_at: Date.now(),
                        _updated_at: Date.now(),
                        _wperm: _wperm,
                        _rperm: _rperm,
                        _acl: _acl,
                        userId: userId,
                        hunterTags: tagsToClaim,
                        realmPoints: 0,
                        dailyTagsClaimed: false,
                        dailyContributionTagsClaimed: false,
                        timesDistributionTagsClaimed: 0,
                        contributionTagsEarned: 0,
                        alliance: undefined,
                        nation: undefined,
                    },
                );

                await NewUser.save();

                return {
                    status: 'success',
                    message: `You have collected ${tagsToClaim} cookies. Keep participating in our quests!`,
                };
            // if the user is found, we check if they've already claimed their tags.
            } else {
                const hasClaimed = entryQuery.claimed;
                // if they already claimed, we throw an error.
                if (hasClaimed) {
                    return {
                        status: 'error',
                        message: 'You have already collected your cookies.',
                    };
                // if they haven't claimed, we do two things:
                // 1. we add the tags to their account.
                // 2. we set the `claimed` field to true.
                } else {
                    if (!userQuery.hunterTags) {
                        userQuery.hunterTags = tagsToClaim;
                    } else {
                        userQuery.hunterTags += tagsToClaim;
                    }

                    userQuery._updated_at = Date.now();
                    await userQuery.save();

                    entryQuery.claimed = true;
                    entryQuery._updated_at = Date.now();
                    await entryQuery.save();

                    return {
                        status: 'success',
                        message: `You have collected ${tagsToClaim} cookies. Keep participating in our quests!`,
                    };
                }
            }
        }
    } catch (err) {
        console.log({
            errorFrom: 'claimQuestTags',
            errorMessage: err,
        });
    }
};

const questEntriesTagClaimButton = () => {
    return [
        {
            type: 2,
            style: 1,
            label: 'Collect your cookies!',
            custom_id: 'questCollectCookies',
        },
    ];
};

module.exports = {
    // getFirstQuestWinners,
    // getAllFirstQuestEntries,
    // addAllFirstQuestEntriesAndWinners,
    claimFirstQuestTags,
    questEntriesTagClaimButton,
};
