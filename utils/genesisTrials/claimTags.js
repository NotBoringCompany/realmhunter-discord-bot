require('dotenv').config();
const mongoose = require('mongoose');
const { generateObjectId } = require('../cryptoUtils');
const permissions = require('../dbPermissions');
const { DiscordUserSchema } = require('../schemas');

mongoose.connect(process.env.MONGODB_URI);

/**
 * `claimDailyTagsLogic` allows all Hunters to claim their daily tags.
 * Depending on their role and/or join date, they can claim more tags.
 */
const claimDailyTagsLogic = async (interaction) => {
    try {
        // we check the amount of tags the user can claim.
        const claimableTags = dailyClaimableTags(interaction);

        // we first check if the user exists in the database. if not, we create a new entry for them.
        const User = mongoose.model('UserData', DiscordUserSchema, 'RHDiscordUserData');
        const userQuery = await User.findOne({ userId: interaction.user.id });

        // if user doesn't exist, we create a new document/user instance for them.
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
                    hunterTags: claimableTags,
                    realmPoints: 0,
                    dailyTagsClaimed: true,
                    dailyContributionTagsClaimed: false,
                },
            );

            // save the new user to the database.
            await NewUser.save();

            return {
                status: 'success',
                message: `You have successfully claimed ${claimableTags} tags.`,
            };
        // if user exists, we update their entry if they haven't claimed their daily tags.
        } else {
            // if user has already claimed their daily tags, we return an error.
            if (userQuery.dailyTagsClaimed) {
                return {
                    status: 'error',
                    message: 'You have already claimed your daily tags.',
                };
            // otherwise, we update their entry.
            } else {
                userQuery.hunterTags += claimableTags;
                userQuery.dailyTagsClaimed = true;
                userQuery._updated_at = Date.now();

                await userQuery.save();

                return {
                    status: 'success',
                    message: `You have successfully claimed ${claimableTags} tags.`,
                };
            }
        }
    } catch (err) {
        throw err;
    }
};

/**
 * `claimableTags` returns the amount of tags a user can claim daily.
 * @param {import('discord.js').Interaction} interaction
 * @return {Number} amount of tags a user can claim daily.
 */
const dailyClaimableTags = (interaction) => {
    const { joinDate, hasWLRole } = checkJoinDateAndRole(interaction);

    // if the user has the WL role, regardless, they can claim more tags.
    if (hasWLRole) {
        if (process.env.MORE_CLAIMABLE_TAGS) return parseInt(process.env.MORE_CLAIMABLE_TAGS);
    // if they don't have the WL role, we check their join date.
    } else {
        // if they joined before 1 Jan 2023 00:00 GMT, they can claim more tags.
        if (joinDate <= process.env.JOIN_DATE_REQUIREMENT) {
            if (process.env.MORE_CLAIMABLE_TAGS) return parseInt(process.env.MORE_CLAIMABLE_TAGS);
        // if they joined after 1 Jan 2023 00:00 GMT, they can only claim the default amount of tags.
        } else {
            if (process.env.DEFAULT_CLAIMABLE_TAGS) return parseInt(process.env.DEFAULT_CLAIMABLE_TAGS);
        }
    }
};

/**
 * `checkJoinDateAndRole` returns the user's join date and whether or not they have the WL role.
 * @param {import('discord.js').Interaction} interaction
 */
const checkJoinDateAndRole = (interaction) => {
    // get the unix timestamp of when the user joined the server.
    const unixTimestamp = Math.floor(interaction.member.joinedTimestamp / 1000);
    const hasWLRole = interaction.member.roles.cache.some((role) => role.name === process.env.WHITELIST_ROLE);

    return {
        joinDate: unixTimestamp,
        hasWLRole: hasWLRole,
    };
};

module.exports = {
    claimDailyTagsLogic,
    dailyClaimableTags,
    checkJoinDateAndRole,
};
