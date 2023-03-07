const mongoose = require('mongoose');
const { generateObjectId } = require('../cryptoUtils');
const permissions = require('../dbPermissions');
const { DiscordUserSchema } = require('../schemas');

/**
 * Manually rewards `userId` with tags.
 */
const manuallyRewardTagsLogic = async (userId, tagsToGive, reason) => {
    try {
        const User = mongoose.model('UserData', DiscordUserSchema, 'RHDiscordUserData');
        const userQuery = await User.findOne({ userId: userId });

        // if user doesn't exist, we create a new user instance for them.
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
                    userId: userId,
                    hunterTags: tagsToGive,
                    realmPoints: 0,
                    dailyTagsClaimed: false,
                    dailyContributionTagsClaimed: false,
                    timesDistributionTagsClaimed: 0,
                    contributionTagsEarned: 0,
                    alliance: undefined,
                    nation: undefined,
                },
            );

            // save the new user instance to the database.
            await NewUser.save();

            console.log('user has been created');
            console.log(`<@${userId}> has been rewarded ${tagsToGive} cookies. Reason: ${reason}`);

            return {
                status: 'success',
                message: `<@${userId}> has been rewarded ${tagsToGive} cookies. Reason: ${reason}`,
            };
        // otherwise, we add `tagsToGive` tags to the user's hunterTags.
        } else {
            userQuery.hunterTags += parseInt(tagsToGive);
            userQuery._updated_at = Date.now();

            await userQuery.save();

            console.log(`<@${userId}> has been rewarded ${tagsToGive} cookies. Reason: ${reason}`);

            return {
                status: 'success',
                message: `<@${userId}> has been rewarded ${tagsToGive} cookies. Reason: ${reason}`,
            };
        }
    } catch (err) {
        console.log({
            errorFrom: 'manuallyRewardTagsLogic',
            errorMessage: err,
        });
    }
};

module.exports = {
    manuallyRewardTagsLogic,
};
