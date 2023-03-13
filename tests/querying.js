require('dotenv').config();
const mongoose = require('mongoose');
const { NationLeadVoteSchema, DiscordUserSchema, NationsSchema } = require('../utils/schemas');

mongoose.connect(process.env.MONGODB_URI);

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

// getVoteResults();
