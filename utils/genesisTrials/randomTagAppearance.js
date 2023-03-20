const cron = require('node-cron');
const mongoose = require('mongoose');
const { TagsSchema, DiscordUserSchema } = require('../schemas');
const permissions = require('../dbPermissions');
const { generateObjectId } = require('../cryptoUtils');
const { randomTagAppearanceEmbed } = require('../../embeds/genesisTrials/randomTagAppearance');

/**
 * `checkPrevTagsAppearance` checks the unix timestamp of the previous random tags appearance in general chat.
 */
const checkPrevTagsAppearance = async () => {
    try {
        // check if there's an instance of the tags data in the database.
        const TagsData = mongoose.model('TagsData', TagsSchema, 'RHDiscordTagsData');
        const tagsQuery = await TagsData.findOne({ uniqueId: 1 });

        // if there's no instance of the tags data, we return 0.
        if (!tagsQuery) return 0;
        if (!tagsQuery.previousAppearance) return 0;

        return tagsQuery.previousAppearance;
    } catch (err) {
        console.log({
            errorFrom: 'checkPrevTagsAppearance',
            errorMessage: err,
        });
    }
};

/**
 * Runs when tags appear in general chat. Updates the `previousAppearance` and `availableToClaim` fields.
 */
const updateTagsAppeared = async () => {
    try {
        // check if there's an instance of the tags data in the database.
        const TagsData = mongoose.model('TagsData', TagsSchema, 'RHDiscordTagsData');
        const tagsQuery = await TagsData.findOne({ uniqueId: 1 });

        // if there's no instance of the tags data, we create a new one.
        if (!tagsQuery) {
            const { _wperm, _rperm, _acl } = permissions(true, false);

            const NewTagsData = new TagsData(
                {
                    _id: generateObjectId(),
                    _created_at: Date.now(),
                    _updated_at: Date.now(),
                    _wperm: _wperm,
                    _rperm: _rperm,
                    _acl: _acl,
                    uniqueId: 1,
                    previousAppearance: Math.floor(new Date().getTime() / 1000),
                    availableToClaim: true,
                },
            );

            // save the new tags data to the database.
            await NewTagsData.save();
        // if there's an instance of the tags data, we update it.
        } else {
            tagsQuery.previousAppearance = Math.floor(new Date().getTime() / 1000);
            tagsQuery.availableToClaim = true;
            tagsQuery._updated_at = Date.now();

            await tagsQuery.save();
        }
    } catch (err) {
        console.log({
            errorFrom: 'updateTagsAppeared',
            errorMessage: err,
        });
    }
};

/**
 * Updates the `RHDiscordTagsData` database. Sets `availableToClaim` to false. Calls `claimRandomTags`.
 */
const updateTagsClaimed = async (message) => {
    try {
        // calls `claimRandomTags` to update the user's `hunterTags` field.
        const { status, message: getMessage } = await claimRandomTags(message);

        // then, it updates the `RHDiscordTagsData` database.
        const TagsData = mongoose.model('TagsData', TagsSchema, 'RHDiscordTagsData');
        const tagsQuery = await TagsData.findOne({ uniqueId: 1 });

        tagsQuery.availableToClaim = false;
        tagsQuery.previousClaimedTimestamp = Math.floor(new Date().getTime() / 1000);
        tagsQuery._updated_at = Date.now();

        await tagsQuery.save();

        return {
            status: status,
            message: getMessage,
        };
    } catch (err) {
        console.log({
            errorFrom: 'updateTagsClaimed',
            errorMessage: err,
        });
    }
};

/**
 * Gets called when a user claims the random tags that got distributed. Updates their `hunterTags` field.
 */
const claimRandomTags = async (message) => {
    try {
        // first, it checks if the tags are claimable.
        const claimable = await checkTagDistributionClaimable();

        if (!claimable) {
            return {
                status: 'error',
                message: 'Cookies have already been collected by someone else. Please wait for Stella to drop the next batch.',
            };
        }

        const User = mongoose.model('User', DiscordUserSchema, 'RHDiscordUserData');
        const userQuery = await User.findOne({ userId: message.author.id });

        // if there's no instance of the user data, we create a new one.
        if (!userQuery) {
            const { _wperm, _rperm, _acl } = permissions(false, false);

            const NewUser = new User(
                {
                    _id: generateObjectId(),
                    _created_at: Date.now(),
                    _updated_at: Date.now(),
                    _wperm: _wperm,
                    _rperm: _rperm,
                    _acl: _acl,
                    userId: message.author.id,
                    // the user will earn the 5 tags they claimed.
                    hunterTags: 5,
                    realmPoints: 0,
                    dailyTagsClaimed: false,
                    dailyContributionTagsClaimed: false,
                    timesDistributionTagsClaimed: 1,
                },
            );

            // save the new user data to the database.
            await NewUser.save();
        // if user exists, we update their `hunterTags` field.
        } else {
            // the user will earn the 5 tags they claimed.
            if (userQuery.hunterTags) {
                userQuery.hunterTags += 5;
            } else {
                userQuery.hunterTags = 5;
            }
            // increase amount of times distribution tags claimed by 1.
            if (userQuery.timesDistributionTagsClaimed) {
                userQuery.timesDistributionTagsClaimed += 1;
            } else {
                userQuery.timesDistributionTagsClaimed = 1;
            }
            userQuery._updated_at = Date.now();

            await userQuery.save();
        }

        return {
            status: 'success',
            message: `Congratulations ${message.author.tag}! You have successfully collected 5 cookies.`,
        };
    } catch (err) {
        console.log({
            errorFrom: 'claimRandomTags',
            errorMessage: err,
        });
    }
};

/**
 * `distributeTags` allows an embed of the tags to appear on general chat and for users to claim them.
 */
const distributeTags = async (client) => {
    try {
        // allows the tags to appear in general chat and updates the tags database.
        await client.channels.cache.get(process.env.GENERAL_CHAT_CHANNELID).send({ embeds: [randomTagAppearanceEmbed] });
        await updateTagsAppeared();
    } catch (err) {
        console.log({
            errorFrom: 'distributeTags',
            errorMessage: err,
        });
    }
};

/**
 * Checks if the current tag distribution is claimable. If yes, first user to claim it will get the tags.
 */
const checkTagDistributionClaimable = async () => {
    try {
        const TagsData = mongoose.model('TagsData', TagsSchema, 'RHDiscordTagsData');
        const tagsQuery = await TagsData.findOne({ uniqueId: 1 });

        if (tagsQuery) {
            return tagsQuery.availableToClaim;
        } else {
            return false;
        }
    } catch (err) {
        console.log({
            errorFrom: 'checkTagDistributionClaimable',
            errorMessage: err,
        });
    }
};

/**
 * Checks when the next tag distribution should occur.
 */
const nextTagDistributionTimestamp = async () => {
    try {
        const TagsData = mongoose.model('TagsData', TagsSchema, 'RHDiscordTagsData');
        const tagsQuery = await TagsData.findOne({ uniqueId: 1 });

        if (tagsQuery) {
            return tagsQuery.nextAppearance;
        } else {
            return 0;
        }
    } catch (err) {
        console.log({
            errorFrom: 'nextTagDistributionTimestamp',
            errorMessage: err,
        });
    }
};

/**
 * Creates the next hour's distribution timestamp.
 */
const nextTagDistribution = async () => {
    try {
        // get the minute for the next distribution to occur.
        const distributionMinute = Math.floor(Math.random() * 60);

        // gets the current date and checks when the next hour's timestamp is.
        const now = new Date();
        now.setHours(now.getHours() + 1);
        now.setMinutes(0, 0, 0);
        const nextHourTimestamp = Math.floor(now.getTime() / 1000);

        // add the distribution minute to the timestamp.
        const nextDistributionTimestamp = nextHourTimestamp + (distributionMinute * 60);

        // update the `nextAppearance` field in the tags database.
        const TagsData = mongoose.model('TagsData', TagsSchema, 'RHDiscordTagsData');
        const tagsQuery = await TagsData.findOne({ uniqueId: 1 });

        tagsQuery.nextAppearance = nextDistributionTimestamp;
        tagsQuery._updated_at = Date.now();

        await tagsQuery.save();
    } catch (err) {
        console.log({
            errorFrom: 'nextTagDistribution',
            errorMessage: err,
        });
    }
};

/**
 * A cron scheduler that runs every hour on the 59th minute. It randomizes the next tag distribution's timestamp for the next hour.
 */
// const nextTagDistributionScheduler = cron.schedule('0 59 * * * *', async () => {
//     // calls `nextTagDistribution` to create the timestamp to distribute the tags for the next hour.
//     await nextTagDistribution();

//     console.log('updated next tag distribution timestamp');
// });

/**
 * A cron scheduler that runs every minute. It checks if the current timestamp matches the next tag distribution's timestamp. If it does, it distributes the tags.
 * If yes, it calls `distributeTags` to distribute the tags.
 */
// const distributeTagScheduler = async (client) => {
//     try {
//         cron.schedule('* * * * *', async () => {
//             // calls `nextTagDistributionTimestamp` to get the next tag distribution's timestamp.
//             const nextDistributionTimestamp = await nextTagDistributionTimestamp();

//             // if the next distribution timestamp is 0, we need to set the next distribution timestamp.
//             // this means that this hour will be voided.
//             if (nextDistributionTimestamp === 0) {
//                 await nextTagDistribution();
//             } else {
//                 // because of the small delay that occurs when this function gets called, we want to check if
//                 // the current timestamp's minute matches the nextDistributionTimestamp.
//                 // for this, we will set the seconds to 0.
//                 // if it matches, we distribute the tags.
//                 const currentTime = new Date();
//                 currentTime.setSeconds(0, 0);
//                 const currentTimestamp = Math.floor(currentTime.getTime() / 1000);

//                 // if the `nextDistributionTimestamp` is behind the current timestamp (which means there is something wrong that the fn didn't get called),
//                 // we need to set the next distribution timestamp.
//                 if (currentTimestamp > nextDistributionTimestamp) {
//                     await nextTagDistribution();
//                 } else {
//                     if (currentTimestamp === nextDistributionTimestamp) {
//                         // calls `distributeTags` to distribute the tags.
//                         await distributeTags(client);
//                     }
//                 }
//             }
//         });
//     } catch (err) {
//         console.log({
//             errorFrom: 'distributeTagScheduler',
//             errorMessage: err,
//         });
//     }
// };

module.exports = {
    claimRandomTags,
    updateTagsClaimed,
    checkPrevTagsAppearance,
    updateTagsAppeared,
    distributeTags,
    checkTagDistributionClaimable,
    nextTagDistributionTimestamp,
    // nextTagDistributionScheduler,
    // distributeTagScheduler,
};
