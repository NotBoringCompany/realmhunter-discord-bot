const { DiscordUserSchema, NationsSchema, NBMonSchema, AllianceSchema } = require('../utils/schemas');
const mongoose = require('mongoose');

require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI);

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


const testCreatedDate = async () => {
    try {
        const NBMon = mongoose.model('NBMonData', NBMonSchema, 'RHDiscordNBMonData');
        const nbmonQuery = await NBMon.findOne().sort({ _created_at: - 1 });

        console.log(nbmonQuery);
    } catch (err) {
        console.log({
            errorFrom: 'testCreatedDate',
            errorMessage: err,
        });
    }
}

// query the best alliance in terms of cookies owned
const topAlliance = async () => {
    try {
        const Alliance = mongoose.model('AllianceData', AllianceSchema, 'RHDiscordAllianceData');
        const allianceQuery = await Alliance.find();

        // for each alliance, we get the total cookies owned across all members.
        // we then sort the alliances by the total cookies owned.
        const allianceData = allianceQuery.map((alliance) => {
            const members = alliance.memberData.map((member) => member.userId);

            return {
                allianceName: alliance.allianceName,
                // get the userId of each member
                members: members,
            };
        });

        // now, we get the total cookies owned by each alliance.
        // to do that, we query the User database for each user ID in the `members` array of `allianceData`.
        const User = mongoose.model('User', DiscordUserSchema, 'RHDiscordUserData');

        const allianceTagData = [];

        for (let i = 0; i < allianceData.length; i++) {
            const alliance = allianceData[i];
            const members = alliance.members;

            let totalTags = 0;

            for (let j = 0; j < members.length; j++) {
                const member = members[j];

                const userQuery = await User.findOne({ userId: member });

                if (userQuery) {
                    totalTags += userQuery.hunterTags;
                }
            }

            allianceTagData.push({
                allianceName: alliance.allianceName,
                members: members,
                totalTags: totalTags,
            });
        }

        // we sort the alliances by the total cookies owned.
        allianceTagData.sort((a, b) => b.totalTags - a.totalTags);

        // get the first 5 of `allianceTagData`.
        const topAlliances = allianceTagData.slice(0, 5);

        return topAlliances;
    } catch (err) {
        console.log({
            errorFrom: 'topAlliance',
            errorMessage: err,
        });
    }
};

const rewardTopAlliances = async () => {
    try {
        // top 1 alliance gets 200 cookies for each member.
        // top 2 alliance gets 150 cookies
        // top 3 alliance gets 100 cookies
        // top 4 alliance gets 75 cookies
        // top 5 alliance gets 50 cookies

        const topAlliances = [
            {
                allianceName: 'AichimaFanClub',
                members: [
                  '206822259006898176',
                  '829983872656736276',
                  '541077276192669714',
                  '884457789014016050',
                  '450091536370368523',
                ],
                totalTags: 7315,
              },
              {
                allianceName: 'ethhhh',
                members: [
                  '996191440013111387',
                  '996191461655715870',
                  '996191452117880924',
                  '1006043015648915486',
                  '1006043109689397329'
                ],
                totalTags: 4725
              },
              {
                allianceName: 'LOCOss',
                members: [
                  '1006042995134582864',
                  '1006043055222161480',
                  '1006043043041914930',
                  '1006043023802642504',
                  '1006043016890437682'
                ],
                totalTags: 4720
              },
              {
                allianceName: 'linnercrr',
                members: [
                  '996190885614194758',
                  '1006043049933144155',
                  '996191289102061568',
                  '996191289093656700',
                  '996191200568688741'
                ],
                totalTags: 4720
              },
              {
                allianceName: 'lonngg',
                members: [
                  '1006042928407392296',
                  '1006042944001822850',
                  '1006043013878919179',
                  '1006043006132035645',
                  '1006043036880478350'
                ],
                totalTags: 4710
              }
            ];

        const rewards = [150, 100, 85, 60, 50];

        const User = mongoose.model('User', DiscordUserSchema, 'RHDiscordUserData');

        for (let i = 0; i < topAlliances.length; i++) {
            const members = topAlliances[i].members;

            // we now update the `hunterTags` of each member in the alliance with the respective rewards.
            for (let j = 0; j < members.length; j++) {
                const query = await User.findOne({ userId: members[j] });
                if (!query) continue;
                if (!query.hunterTags) {
                    query.hunterTags = rewards[i];
                } else {
                    query.hunterTags += rewards[i];
                }

                query._updated_at = Date.now();
                await query.save();
            }
        }

        console.log('done');
    } catch (err) {
        console.log({
            errorFrom: 'rewardTopAlliances',
            errorMessage: err,
        });
    }
};

const rewardNations = async () => {
    try {
        const nationLeaderboard = [
            { nation: 'Russia', tags: 75 },
            { nation: 'Ukraine', tags: 60 },
            { nation: 'Serbia', tags: 60 },
            { nation: 'Italy', tags: 60 },
            { nation: 'Germany', tags: 50 },
            { nation: 'France', tags: 50 },
            { nation: 'Spain', tags: 50 },
            { nation: 'Pakistan', tags: 40 },
            { nation: 'Bangladesh', tags: 40 },
            { nation: 'Malaysia', tags: 40 },
            { nation: 'Turkey', tags: 40 },
            { nation: 'Brazil', tags: 30 },
            { nation: 'Philippines', tags: 20 },
            { nation: 'China', tags: 10 },
            { nation: 'Nigeria', tags: -5 },
            { nation: 'Vietnam', tags: -10 },
            { nation: 'Indonesia', tags: -15 },
            { nation: 'UK', tags: -20 },
            { nation: 'India', tags: -30 },
            { nation: 'Japan', tags: -40 },
            { nation: 'Korea', tags: -40 },
            { nation: 'Thailand', tags: -40 },
            { nation: 'USA', tags: -50 },
            { nation: 'Canada', tags: -60 },
        ];

        // test with russia. if it works, we'll do the rest.
        const Nation = await mongoose.model('Nation', NationsSchema, 'RHDiscordNationsData');

        const notFinishedNations = [];

        for (let i = 0; i < nationLeaderboard.length; i++) {
            const nationQuery = await Nation.findOne({ nation: nationLeaderboard[i].nation });
            if (!nationQuery) notFinishedNations.push(nationLeaderboard[i].nation);

            const nationMembers = nationQuery.members.map((member) => member.userId);

            const User = mongoose.model('User', DiscordUserSchema, 'RHDiscordUserData');
            await User.updateMany({ userId: { $in: nationMembers } }, { $inc: { hunterTags: nationLeaderboard[i].tags } });
            console.log('updated for nation: ' + nationLeaderboard[i].nation);
        }
        console.log('done');
    } catch (err) {
        console.log({
            errorFrom: 'rewardNations',
            errorMessage: err,
        });
    }
};

const getNegative = async () => {
    try {
        const User = mongoose.model('User', DiscordUserSchema, 'RHDiscordUserData');
        const users = await User.find({ hunterTags: { $lt: 0 } });

        // await User.updateMany({ hunterTags: { $lt: 0 } }, { $set: { hunterTags: 0 } });

        console.log(users);
    } catch (err) {
        console.log({
            errorFrom: 'getNegative',
            errorMessage: err,
        });
    }
};