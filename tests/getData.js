const { DiscordUserSchema, NationsSchema } = require('../utils/schemas');
const mongoose = require('mongoose');

require('dotenv').config();

/**
 * Gets all eligible stakers with `doubleTagEligiblity` as true.
 */
const getEligibleStakers = async () => {
    try {
        // we get the list of all eligible stakers.
        const User = mongoose.model('UserData', DiscordUserSchema, 'RHDiscordUserData');
        const userQuery = await User.find({ doubleTagEligibility: true });

        const eligibleUsers = userQuery.map((user) => {
            return {
                userId: user.userId,
                nation: (user._p_nation).split('$')[1],
            };
        });

        const foundUsers = [];

        // for each user id, we query through the nations and find how much they staked.
        const Nation = mongoose.model('Nation', NationsSchema, 'RHDiscordNationsData');
        for (let i = 0; i < eligibleUsers.length; i++) {
            const user = eligibleUsers[i].userId;
            const nation = eligibleUsers[i].nation;

            // we get the nation.
            const nationQuery = await Nation.findOne({ objectId: nation });

            // we find the user in `stakedTags`.
            const stakedTags = nationQuery.stakedTags;

            // console.log(stakedTags)
            const userStakedTags = stakedTags.find((staker) => staker.userId === user);

            if (userStakedTags) {
                foundUsers.push({
                    userId: user,
                    nation: nation,
                    stakedTags: userStakedTags.stakeAmount,
                });
            }
        }

        return foundUsers;
    } catch (err) {
        console.log({
            errorFrom: 'getEligibleStakers',
            errorMessage: err,
        });
    }
};

const rewardDoubleEligibleStakers = async () => {
    try {
        // get the list of eligible stakers.
        const eligibleStakers = await getEligibleStakers();

        console.log('done getting eligible stakers');

        const User = mongoose.model('UserData', DiscordUserSchema, 'RHDiscordUserData');

        for (let i = 0; i < eligibleStakers.length; i++) {
            // we add `stakedTags` to their `hunterTags`.
            const user = eligibleStakers[i].userId;
            const stakedTags = eligibleStakers[i].stakedTags;

            const userQuery = await User.findOne({ userId: user });

            if (!userQuery) {
                continue;
            }

            if (!userQuery.hunterTags) {
                userQuery.hunterTags = stakedTags;
            } else {
                userQuery.hunterTags += stakedTags;
            }

            userQuery._updated_at = Date.now();
            await userQuery.save();
        }

        console.log('done rewarding eligible stakers');
    } catch (err) {
        console.log({
            errorFrom: 'rewardDoubleEligibleStakers',
            errorMessage: err,
        });
    }
};