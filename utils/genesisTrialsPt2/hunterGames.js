require('dotenv').config();
const { HunterGamesDataSchema, HunterGamesParticipantsSchema, DiscordUserSchema } = require('../schemas');
const mongoose = require('mongoose');
const { generateObjectId } = require('../cryptoUtils');
const permissions = require('../dbPermissions');
const { hunterGamesEmbed, hunterGamesNoParticipantsEmbed, hunterGamesStartMessageEmbed, hunterGamesFinishedEmbed, hunterGamesBattle } = require('../../embeds/genesisTrialsPt2/hunterGames');
const { delay } = require('../delay');
const cron = require('node-cron');

/**
 * Gets the most recent hunter games ID.
 */
const getCurrentHunterGamesId = async () => {
    try {
        const HunterGamesData = mongoose.model('HunterGamesData', HunterGamesDataSchema, 'RHDiscordHunterGamesData');
        const dataQuery = await HunterGamesData.findOne({}).sort({ gameId: -1 });

        if (!dataQuery) {
            return 0;
        } else {
            return dataQuery.gameId;
        }
    } catch (err) {
        console.log({
            errorFrom: 'getCurrentHunterGamesId',
            errorMessage: err,
        });
    }
};

/**
 * Adds a new Hunter Games to the database. Gets the previous ID and increments it by 1.
 */
const addNewGame = async () => {
    try {
        const HunterGamesData = mongoose.model('HunterGamesData', HunterGamesDataSchema, 'RHDiscordHunterGamesData');

        const { _wperm, _rperm, _acl } = permissions(true, false);
        const currentId = await getCurrentHunterGamesId();

        const NewGame = new HunterGamesData(
            {
                _id: generateObjectId(),
                _created_at: Date.now(),
                _updated_at: Date.now(),
                _wperm: _wperm,
                _rperm: _rperm,
                _acl: _acl,
                gameId: currentId + 1,
                isComplete: false,
            },
        );

        await NewGame.save();

        return {
            status: 'success',
            message: `Successfully added a new Hunter Games with ID ${currentId + 1}.`,
        };
    } catch (err) {
        console.log({
            errorFrom: 'addNewGame',
            errorMessage: err,
        });
    }
};

/**
 * Changes `complete` to true for `gameId`.
 */
const hunterGamesComplete = async (gameId) => {
    try {
        const HunterGamesData = mongoose.model('HunterGamesData', HunterGamesDataSchema, 'RHDiscordHunterGamesData');
        const dataQuery = await HunterGamesData.findOne({ gameId: gameId });

        if (!dataQuery) {
            return {
                status: 'error',
                message: 'No Hunter Games found.',
            };
        }

        dataQuery.isComplete = true;
        dataQuery._updated_at = Date.now();

        await dataQuery.save();

        return {
            status: 'success',
            message: `Successfully marked Hunter Games ${gameId} as complete.`,
        };
    } catch (err) {
        console.log({
            errorFrom: 'hunterGamesComplete',
            errorMessage: err,
        });
    }
};

/**
 * Adds a participant to `RHDiscordHunterGamesParticipants`.
 * Deducts 30 tags for entering.
 */
const addParticipant = async (userId) => {
    try {
        const HunterGamesParticipant = mongoose.model('HunterGamesParticipant', HunterGamesParticipantsSchema, 'RHDiscordHunterGamesParticipants');
        const User = mongoose.model('UserData', DiscordUserSchema, 'RHDiscordUserData');

        // we first check if user exists. if not, they can't join bc they don't have enough tags.
        const userQuery = await User.findOne({ userId: userId });

        if (!userQuery) {
            return {
                status: 'error',
                message: 'Not enough cookies to join the Hunter Games.',
            };
        }

        // we first check if the user has already taken part in the Hunter Games.
        const participantQuery = await HunterGamesParticipant.findOne({ userId: userId });
        if (participantQuery) {
            return {
                status: 'error',
                message: 'You have already joined the current Hunter Games.',
            };
        }

        // otherwise, we get their `hunterTags`.
        const hunterTags = userQuery.hunterTags;

        if (!hunterTags || hunterTags < parseInt(process.env.HUNTER_GAMES_ENTRANCE_FEE)) {
            return {
                status: 'error',
                message: 'Not enough cookies to join the Hunter Games.',
            };
        }

        // otherwise, we will deduct their cookies and add them to the database.
        userQuery.hunterTags -= parseInt(process.env.HUNTER_GAMES_ENTRANCE_FEE);
        userQuery._updated_at = Date.now();

        const { _wperm, _rperm, _acl } = permissions(true, false);

        const NewParticipant = new HunterGamesParticipant(
            {
                _id: generateObjectId(),
                _created_at: Date.now(),
                _updated_at: Date.now(),
                _wperm: _wperm,
                _rperm: _rperm,
                _acl: _acl,
                userId: userId,
            },
        );

        await userQuery.save();
        await NewParticipant.save();

        return {
            status: 'success',
            message: `You have joined the Hunter Games. Good luck.`,
        };
    } catch (err) {
        console.log({
            errorFrom: 'addParticipant',
            errorMessage: err,
        });
    }
};

/**
 * Deletes ALL participants from `RHDiscordHunterGamesParticipants`.
 * Called either when the Hunter Games is over or when there are not enough people joining.
 */
const deleteParticipants = async () => {
    try {
        const HunterGamesParticipant = mongoose.model('HunterGamesParticipant', HunterGamesParticipantsSchema, 'RHDiscordHunterGamesParticipants');
        // delete all participants
        await HunterGamesParticipant.deleteMany({});

        return {
            status: 'success',
            message: 'Successfully deleted all participants.',
        };
    } catch (err) {
        console.log({
            errorFrom: 'deleteParticipants',
            errorMessage: err,
        });
    }
};

/**
 * Gets all participants for the current Hunter Games.
 */
const getAllParticipants = async () => {
    try {
        const HunterGamesParticipant = mongoose.model('HunterGamesParticipant', HunterGamesParticipantsSchema, 'RHDiscordHunterGamesParticipants');
        const participantsQuery = await HunterGamesParticipant.find({});

        return participantsQuery.length > 0 || participantsQuery ? participantsQuery.map((participant) => participant.userId) : [];
    } catch (err) {
        console.log({
            errorFrom: 'getAllParticipants',
            errorMessage: err,
        });
    }
};

/**
 * If the Hunter Games is cancelled, refunds the entrance fee (tags) back to all participants.
 */
const refundEntranceFee = async () => {
    try {
        const HunterGamesParticipant = mongoose.model('HunterGamesParticipant', HunterGamesParticipantsSchema, 'RHDiscordHunterGamesParticipants');
        const participantsQuery = await HunterGamesParticipant.find({});

        if (!participantsQuery) {
            return;
        }

        const User = mongoose.model('UserData', DiscordUserSchema, 'RHDiscordUserData');

        // since the requirement for the games to start only requires 2 people, we can do a simple for loop.
        for (let i = 0; i < participantsQuery.length; i++) {
            const userId = participantsQuery[i].userId;
            const userQuery = await User.findOne({ userId: userId });

            if (!userQuery) {
                continue;
            }

            userQuery.hunterTags += parseInt(process.env.HUNTER_GAMES_ENTRANCE_FEE);

            await userQuery.save();
        }

        return {
            status: 'success',
            message: 'Successfully refunded all participants.',
        };
    } catch (err) {
        console.log({
            errorFrom: 'refundEntranceFee',
            errorMessage: err,
        });
    }
};

/**
 * All winners will be given Realm Points based on their rank.
 * Winners data includes: 1. user ID and 2. realm points to be given.
 */
const claimRealmPoints = async (winnersData) => {
    try {
        if (!winnersData) {
            return {
                status: 'error',
                message: 'No winners data.',
            };
        }

        const User = mongoose.model('UserData', DiscordUserSchema, 'RHDiscordUserData');

        // we loop through each winners data and add the appropriate amount of RP.
        for (let i = 0; i < winnersData.length; i++) {
            const winnerData = winnersData[i];
            const userId = winnerData.userId;
            const realmPointsEarned = winnerData.realmPointsEarned;

            const userQuery = await User.findOne({ userId: userId });
            if (!userQuery.realmPoints) {
                userQuery.realmPoints = realmPointsEarned;
            } else {
                userQuery.realmPoints += realmPointsEarned;
            }

            await userQuery.save();
        }

        return {
            status: 'success',
            message: 'Successfully given Realm Points to all winners.',
        };
    } catch (err) {
        console.log({
            errorFrom: 'claimRealmPoints',
            errorMessage: err,
        });
    }
};

/**
 * Gets the winners for the Hunter Games.
 */
const hunterGamesWinners = async (client, participantsArray, participantsCount) => {
    try {
        /**
         * LOGIC FOR WINNER LEADERBOARD IS AS FOLLOWS:
         * (EXTRA RP ON TOP OF PARTICIPATION POINTS)
         * IF < 25 PARTICIPANTS, WINNER EARNS 90 RP.
         * IF 26 - 50 PARTICIPANTS, TOP 3 EARNS: 110, 95, 85 RP.
         * IF 51 - 100 PARTICIPANTS, TOP 5 EARNS: 125, 110, 95, 85, 80 RP.
         * IF 101 - 150 PARTICIPANTS, TOP 7 EARNS: 140, 125, 110, 100, 90, 80, 70 RP.
         * IF 151 - 200 PARTICIPANTS, TOP 10 EARNS: 180, 160, 140, 130, 120, 110, 100, 90, 80, 70 RP.
         * IF 201 - 300 PARTICIPANTS, TOP 15 EARNS: 240, 230, 215, 195, 170, 150, 140, 125, 110, 100, 90, 80, 70, 60, 50 RP.
         * IF > 301 PARTICIPANTS, TOP 25 EARNS: 320, 310, 300, 290, 280, 270, 260, 250, 240, 230, 215, 195, 170, 150, 140, 125, 110, 100, 90, 80, 70, 60, 50, 40, 30 RP.
         */
        let leaderboardAsString = '';
        let ranking = 1;
        // store winners data into array of objects to reward them with realm points.
        const winnersData = [];

        if (participantsCount <= 25) {
            const winner = participantsArray.filter(p => p.diedAtPosition === 0)[0];

            // 1 winner. we store the data to the winnersData array.
            const winnerData = {
                userId: winner.userId,
                realmPointsEarned: 90,
            };
            winnersData.push(winnerData);

            // only 1 winner.
            leaderboardAsString += `🏆 | 1. <@${winner.userId}> - 90 Favor Points.`;
        } else if (participantsCount >= 26 && participantsCount <= 50) {
            // 3 winners.
            const points = [110, 95, 85];
            const top3 = participantsArray.filter(p => p.diedAtPosition <= 3);
            const sortedWinners = top3.sort((a, b) => a.diedAtPosition - b.diedAtPosition);

            sortedWinners.forEach((winner) => {
                const winnerData = {
                    userId: winner.userId,
                    realmPointsEarned: points[ranking - 1],
                };
                winnersData.push(winnerData);

                leaderboardAsString += `🥈 | ${ranking}. <@${winner.userId}> - ${points[ranking - 1]} Favor Points.`;
                ranking++;
            });
        } else if (participantsCount >= 51 && participantsCount <= 100) {
            // 5 winners.
            const points = [125, 110, 95, 85, 80];
            const top5 = participantsArray.filter(p => p.diedAtPosition <= 5);
            const sortedWinners = top5.sort((a, b) => a.diedAtPosition - b.diedAtPosition);

            sortedWinners.forEach((winner) => {
                const winnerData = {
                    userId: winner.userId,
                    realmPointsEarned: points[ranking - 1],
                };
                winnersData.push(winnerData);

                leaderboardAsString += `🥈 | ${ranking}. <@${winner.userId}> - ${points[ranking - 1]} Favor Points.`;
                ranking++;
            });
        } else if (participantsCount >= 101 && participantsCount <= 150) {
            // 7 winners.
            const points = [140, 125, 110, 100, 90, 80, 70];
            const top7 = participantsArray.filter(p => p.diedAtPosition <= 7);
            const sortedWinners = top7.sort((a, b) => a.diedAtPosition - b.diedAtPosition);

            sortedWinners.forEach((winner) => {
                const winnerData = {
                    userId: winner.userId,
                    realmPointsEarned: points[ranking - 1],
                };
                winnersData.push(winnerData);

                leaderboardAsString += `🥈 | ${ranking}. <@${winner.userId}> - ${points[ranking - 1]} Favor Points.`;
                ranking++;
            });
        } else if (participantsCount >= 151 && participantsCount <= 200) {
            // 10 winners.
            const points = [180, 160, 140, 130, 120, 110, 100, 90, 80, 70];
            const top10 = participantsArray.filter(p => p.diedAtPosition <= 10);
            const sortedWinners = top10.sort((a, b) => a.diedAtPosition - b.diedAtPosition);

            sortedWinners.forEach((winner) => {
                const winnerData = {
                    userId: winner.userId,
                    realmPointsEarned: points[ranking - 1],
                };
                winnersData.push(winnerData);

                leaderboardAsString += `🥈 | ${ranking}. <@${winner.userId}> - ${points[ranking - 1]} Favor Points.`;
                ranking++;
            });
        } else if (participantsCount >= 201 && participantsCount <= 300) {
            // 15 winners.
            const points = [240, 230, 215, 195, 170, 150, 140, 125, 110, 100, 90, 80, 70, 60, 50];
            const top15 = participantsArray.filter(p => p.diedAtPosition <= 15);
            const sortedWinners = top15.sort((a, b) => a.diedAtPosition - b.diedAtPosition);

            sortedWinners.forEach((winner) => {
                const winnerData = {
                    userId: winner.userId,
                    realmPointsEarned: points[ranking - 1],
                };
                winnersData.push(winnerData);

                leaderboardAsString += `🥈 | ${ranking}. <@${winner.userId}> - ${points[ranking - 1]} Favor Points.`;
                ranking++;
            });
        } else if (participantsCount >= 301) {
            // 25 winners.
            const points = [320, 310, 300, 290, 280, 270, 260, 250, 240, 230, 215, 195, 170, 150, 140, 125, 110, 100, 90, 80, 70, 60, 50, 40, 30];
            const top25 = participantsArray.filter(p => p.diedAtPosition <= 25);
            const sortedWinners = top25.sort((a, b) => a.diedAtPosition - b.diedAtPosition);

            sortedWinners.forEach((winner) => {
                const winnerData = {
                    userId: winner.userId,
                    realmPointsEarned: points[ranking - 1],
                };
                winnersData.push(winnerData);

                leaderboardAsString += `🥈 | ${ranking}. <@${winner.userId}> - ${points[ranking - 1]} Favor Points.`;
                ranking++;
            });
        }

        const winnerEmbed = await client.channels.cache.get(process.env.TEST_HUNTERGAMES_CHANNELID).send({
            embeds: [hunterGamesFinishedEmbed(leaderboardAsString)],
        });

        // reward all participants with 10 Realm Points first, and then reward the winners.
        await rewardParticipationPoints();
        await claimRealmPoints(winnersData);
    } catch (err) {
        console.log({
            errorFrom: 'hunterGamesWinners',
            errorMessage: err,
        });
    }
};

/**
 * Reward each participant who participated in the Hunter Games with 10 Realm Points.
 */
const rewardParticipationPoints = async () => {
    try {
        const HunterGamesParticipant = mongoose.model('HunterGamesParticipant', HunterGamesParticipantsSchema, 'RHDiscordHunterGamesParticipants');
        const participantsQuery = await HunterGamesParticipant.find({});

        if (participantsQuery.length === 0) return;

        // return the user ID of each participant to an array.
        const participantsArray = participantsQuery.map((participant) => participant.userId);

        // now, we will reward each participant with 10 Realm Points.
        const User = mongoose.model('User', DiscordUserSchema, 'RHDiscordUserData');
        // we update each user ID in `participantsArray` with 10 Realm Points.
        await User.updateMany({ userId: { $in: participantsArray } }, { $inc: { realmPoints: 10 } });

        return {
            status: 'success',
            message: 'Successfully rewarded all participants with 10 Realm Points.',
        };
    } catch (err) {
        console.log({
            errorFrom: 'rewardParticipationPoints',
            errorMessage: err,
        });
    }
};

/**
 * Starts a Hunter Games instance.
 */
const startHunterGames = async (client) => {
    try {
        const { status: newGameStatus, message: newGameMessage } = await addNewGame();
        if (newGameStatus === 'error') console.log(newGameMessage);
        const currentGameId = await getCurrentHunterGamesId();

        // we will put the embed in the hunter games channel
        const getHunterGamesEmbed = await client.channels.cache.get(process.env.TEST_HUNTERGAMES_CHANNELID).send({
            embeds: [hunterGamesEmbed(currentGameId, 'https://i.imgur.com/1qlNeHf.jpg')],
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            style: 1,
                            label: 'Join the Hunter Games. 30 cookies required.',
                            custom_id: `joinHunterGamesButton${currentGameId}`,
                        },
                    ],
                },
            ],
        });

        // wait 3 seconds before putting the message in general chat.
        await delay(3000);

        // send the participant count message to the general chat.
        let participantsCount = await client.channels.cache.get(process.env.TEST_HUNTERGAMES_CHANNELID).send('Current participant count: 0');

        // cron scheduler to update `participantsCount` every 2 seconds.
        const checkParticipantCount = cron.schedule('*/2 * * * * *', async () => {
            const currentParticipants = await getAllParticipants();
            participantsCount.edit(`Current participant count: ${currentParticipants.length}`);
        });

        // then, we put the message that the games is starting in general chat.
        await client.channels.cache.get(process.env.TEST_GENERAL_CHAT_CHANNELID).send(
            'The Hunter Games has been declared and will start in 5 minutes!' +
            ' Fight other citizens and prove your worth and become one step closer to becoming a Hunter!' +
            ' Earn participation points and earn even more for being in the top!' +
            ` Hunter Games will start in 5 minutes. <#${process.env.TEST_HUNTERGAMES_CHANNELID}>`,
        );

        // after 5 minutes, we query the participants that joined the Hunter Games.
        ///////////// for now, we will use 10 seconds just for testing.
        //////////// ADD UPDATE MESSAGES HERE TO LET THEM KNOW ITS STARTING SOON. ///////////////
        await delay(10000);
        const getParticipants = await getAllParticipants();

        const participants = [];

        // wait 5 seconds before game starts.
        await delay(5000);

        getParticipants.forEach((participant) => {
            const participantData = {
                index: participants.length,
                userId: participant,
                kills: 0,
                hasDied: false,
                // if participant died when there's 20 people left (example), then he'll be at position 20.
                diedAtPosition: 0,
            };

            participants.push(participantData);
        });

        // initially, `participantsLeft` will always equal the `participants` array.
        // but, as the game progresses, `participantsLeft` will decrease after each kill/suicide that happens.
        const participantsLeft = participants.map((participant) => {
            return participant;
        });

        // check if there are enough participants. if there's only 1 participant, game is cancelled.
        if (participantsLeft.length <= 1) {
            await client.channels.cache.get(process.env.TEST_HUNTERGAMES_CHANNELID).send({
                embeds: [hunterGamesNoParticipantsEmbed],
            });

            // we refund participants their tags.
            const { status, message } = await refundEntranceFee();
            if (status === 'error') console.log(message);

            // we delete the participants from the participants database.
            await deleteParticipants();

            return {
                status: 'success',
                message: 'Not enough participants.',
            };
        }

        // if there are enough participants, we start the hunter games.
        const startHunterGames = await client.channels.cache.get(process.env.TEST_HUNTERGAMES_CHANNELID).send({
            embeds: [hunterGamesStartMessageEmbed(participantsLeft.length)],
        });

        //////////// LOGIC FOR HUNTER GAMES STARTS HERE. /////////////
        let currentRound = 1;

        // as long as there is at least 1 participant left, the logic continues.
        while (participantsLeft.length > 0) {
            // if there's only 1 player left, we will break the loop and continue towards the winner logic.
            if (participantsLeft.length === 1) {
                console.log('1 player left at round: ', currentRound);
                break;
            }

            // dice roll for the round to determine the amount of participants that will fight for this round.
            let roundDiceRoll;
            if (participantsLeft.length <= 15) {
                roundDiceRoll = Math.floor(Math.random() * 3) + 1;
            } else if (participantsLeft.length <= 30) {
                roundDiceRoll = Math.floor(Math.random() * 5) + 1;
            } else if (participantsLeft.length <= 60) {
                roundDiceRoll = Math.floor(Math.random() * 7) + 1;
            } else if (participantsLeft.length <= 120) {
                roundDiceRoll = Math.floor(Math.random() * 10) + 1;
            } else if (participantsLeft.length <= 300) {
                roundDiceRoll = Math.floor(Math.random() * 15) + 1;
            } else {
                roundDiceRoll = Math.floor(Math.random() * 20) + 1;
            }

            // the participants that will fight each other this round (depending on `roundDiceRoll`)
            const participantsToFight = [];

            // if the dice roll is greater than or equal to the amount of participants left, we will only need to include the remaining participants.
            if (roundDiceRoll >= participantsLeft.length) {
                console.log('Dice rolled is more than participants left for this round.');
                console.log(`Dice roll: ${roundDiceRoll}, participants left: ${participantsLeft.length}`);
                participantsLeft.forEach((participant) => {
                    participantsToFight.push(participant);
                });
            // otherwise, we will randomly select participants to fight each other.
            } else {
                console.log('Dice rolled is less than participants left for this round.');
                console.log(`Dice roll: ${roundDiceRoll}, participants left: ${participantsLeft.length}`);
                // we will fill the participantsToFight array with `roundDiceRoll` participants.
                while (participantsToFight.length < roundDiceRoll) {
                    const randParticipant = participantsLeft[Math.floor(Math.random() * participantsLeft.length)];
                    const participantFound = participantsToFight.find((participant) => participant.userId === randParticipant.userId);

                    if (!participantFound) participantsToFight.push(randParticipant);
                }
            }

            // once `participantsToFight` is gathered, we will determine the winners of each round.
            // e.g. if 8 participants, then p1 fights p2, p3 fights p4 ...
            // if there is an odd number of participants, the last participant may or may not die.
            // we will first check if participantsLeft is 1. if yes, then they won't die and become the winner.

            // battle messages for this round (what happened, who killed who etc)
            const roundBattleMessages = [];

            while (participantsToFight.length > 0) {
                // if there's only 1 participant left in the round, we check if they're the last participant left in the entire game.
                if (participantsToFight.length === 1) {
                    // if they're the last participant in the entire game, we will do the winner logic here instantly.
                    if (participantsLeft.length === 1) {
                        // winner logic here. game SHOULD end.
                        console.log('Last participant! They won!');
                        return await hunterGamesWinners(client, participants, participants.length);
                    // if they're not the last participant in the entire game, we roll a dice to see if they will die.
                    } else {
                        // get participant
                        const participantToFight = participantsToFight[0];
                        const diceRoll = Math.floor(Math.random() * 2) + 1;

                        // if the dice rolls 1, they die.
                        if (diceRoll === 1) {
                            // do 3 things.
                            // 1. update `hasDied` and `diedAtPosition` of the participant in the `participants` array.
                            // 2. remove participant from `participantsToFight` array
                            // 3. remove participant from `participantsLeft` array
                            const battleMessage = battleMessageTemplates('suicide', participantToFight.userId);
                            roundBattleMessages.push(battleMessage);

                            // update participant data in `participants` array.
                            participants[participantToFight.index].hasDied = true;
                            participants[participantToFight.index].diedAtPosition = participantsLeft.length;

                            // get index of participant in participantsLeft array.
                            const participantsLeftIndex = participantsLeft.findIndex(p => p.userId === participantToFight.userId);

                            // remove participant from `participantsToFight` array
                            participantsToFight.splice(0, 1);

                            // remove participant from `participantsLeft` array.
                            participantsLeft.splice(participantsLeftIndex, 1);
                        // if the dice rolls a 2, they survive (i.e. nothing happened basically)
                        } else {
                            const battleMessage = battleMessageTemplates('survive', participantToFight.userId);
                            roundBattleMessages.push(battleMessage);
                            // remove participant from `participantsToFight` array so next round can start.
                            participantsToFight.splice(0, 1);
                        }
                    }
                // if there are still at least 2 or more participants in the round, we let the participants fight.
                } else {
                    const participantOne = participantsToFight[0];
                    const participantTwo = participantsToFight[1];

                    const diceRoll = Math.floor(Math.random() * 2) + 1;

                    // if dice rolls 1, participant 1 kills 2.
                    if (diceRoll === 1) {
                        // do 3 things:
                        // 1. update kills of p1 + update `hasDied` and `diedAtPosition` of p2 in participants array.
                        // 2. remove p1 and p2 from `participantsToFight` array
                        // 3. remove p2 from `participantsLeft` array
                        console.log('winner is player 1');

                        const battleMessage = battleMessageTemplates('kill', participantOne.userId, participantTwo.userId);
                        roundBattleMessages.push(battleMessage);

                        // update kills of p1 + update `hasDied` and `diedAtPosition` of p2 in participants array.
                        participants[participantOne.index].kills += 1;
                        participants[participantTwo.index].hasDied = true;
                        participants[participantTwo.index].diedAtPosition = participantsLeft.length;

                        // get the index of p2 in `participantsLeft` array
                        const participantsLeftIndex = participantsLeft.findIndex(p => p.userId === participantTwo.userId);

                        // remove p1 and p2 from `participantsToFight` array
                        participantsToFight.splice(0, 2);

                        // remove p2 from `participantsLeft` array
                        participantsLeft.splice(participantsLeftIndex, 1);
                    // if dice rolls 2, participant 2 kills participant 1.
                    } else {
                        // do 3 things:
                        // 1. update kills of p2 + update `hasDied` and `diedAtPosition` of p1 in participants array.
                        // 2. remove p1 and p2 from `participantsToFight` array
                        // 3. remove p1 from `participantsLeft` array
                        console.log('winner is player 2');

                        const battleMessage = battleMessageTemplates('kill', participantTwo.userId, participantOne.userId);
                        roundBattleMessages.push(battleMessage);

                        // update kills of p2 + update `hasDied` and `diedAtPosition` of p1 in participants array.
                        participants[participantTwo.index].kills += 1;
                        participants[participantOne.index].hasDied = true;
                        participants[participantOne.index].diedAtPosition = participantsLeft.length;

                        // get the index of p1 in `participantsLeft` array
                        const participantsLeftIndex = participantsLeft.findIndex(p => p.userId === participantOne.userId);

                        // remove p1 and p2 from `participantsToFight` array
                        participantsToFight.splice(0, 2);

                        // remove p1 from `participantsLeft` array
                        participantsLeft.splice(participantsLeftIndex, 1);
                    }
                }
            }

            // if there are no more participants to fight, we end the round.
            // we compile the current round's battle messages and make it a single string.
            let battleMessageString = '';
            roundBattleMessages.forEach((msg) => {
                battleMessageString += `${msg}\n`;
            });

            // wait 3 seconds before showing the current round's results and starting the next round
            await delay(3000);

            const currentRoundResults = await client.channels.cache.get(process.env.TEST_HUNTERGAMES_CHANNELID).send({
                embeds: [hunterGamesBattle(currentRound, battleMessageString, participantsLeft.length)],
            });

            // wait 5 seconds before starting next round.
            await delay(5000);
            currentRound++;
        }

        // leaderboard + winner logic
        await hunterGamesWinners(client, participants, participants.length);
        // delete current games participants from database.
        await deleteParticipants();
        await hunterGamesComplete(currentGameId);

        return {
            success: true,
            message: 'Hunter Games has ended.',
        };
    } catch (err) {
        console.log({
            errorFrom: 'startHunterGames',
            errorMessage: err,
        });
    }
};

/**
 * Battle message templates.
 * @param {String} type either kill, suicide or survive.
 * If the participant suicided or 'survived' via the dice roll, they're automatically defaulted to `killer`.
 */
const battleMessageTemplates = (type, killer, victim) => {
    const killMessages = [
        `🔪 | __**<@${killer}>**__ stabbed __**<@${victim}>**__ in the back.`,
        `🔪 | __**<@${killer}>**__ shot __**<@${victim}>**__ in the head. The audacity!`,
        `🔪 | __**<@${killer}>**__ threw a grenade at __**<@${victim}>**__ and smothered them into pieces.`,
        `🔪 | __**<@${killer}>**__ lurked in the shadows and surprised __**<@${victim}>**__ from afar. __**<@${victim}>**__ didn't stand a chance.`,
        `🔪 | __**<@${killer}>**__ was making sure __**<@${victim}>**__ wouldn't be a threat to them anymore.`,
        `🔪 | __**<@${victim}>**__ was a very loved person, but __**<@${killer}>**__ didn't care. They killed __**<@${victim}>**__ anyway.`,
        `🔪 | __**<@${killer}>**__ is a very skilled Hunter. They knew where exactly to aim to kill __**<@${victim}>**__.`,
        `🔪 | __**<@${killer}>**__ tricked __**<@${victim}>**__ into giving them a tasty meal. There was poison inside. Tough luck, __**<@${victim}>**__.`,
        `🔪 | __**<@${victim}>**__ needs to stop being so cocky. __**<@${killer}>**__ taught them a lesson by assassinating them.`,
        `🔪 | __**<@${victim}>**__ walked the wrong path and __**<@${killer}>**__ was already waiting for them. __**<@${victim}>**__ was unfortunately killed.`,
        `🔪 | __**<@${killer}>**__ found a very sharp-edged rock and used it to slit __**<@${victim}>**__'s throat wide open.`,
        `🔪 | __**<@${killer}>**__ was lucky enough to find a pickaxe. __**<@${victim}>**__ unfortunately was too close to __**<@${killer}>**__ and paid the price.`,
        `🔪 | Who gave __**<@${killer}>**__ a revolver? They unloaded all 6 bullets to __**<@${victim}>**__'s head.`,
        `🔪 | __**<@${killer}>**__ went on a brawl with __**<@${victim}>**__. Unfortunately, __**<@${victim}>**__ lost and were shortly eaten by wild scavengers.`,
        `🔪 | __**<@${killer}>**__ had the high ground and unfortunately __**<@${victim}>**__ was underneath them. __**<@${victim}>**__ was shot in the head.`,
        `🔪 | __**<@${killer}>**__ threw a tomahawk across the map. Unfortunately for __**<@${victim}>**__, it somehow landed straight on their skull. Ouch.`,
        `🔪 | __**<@${victim}>**__ should have been more quiet. __**<@${killer}>**__'s killer instincts kicked in and they found __**<@${victim}>**__ and butchered them.`,
        `🔪 | __**<@${killer}>**__ found __**<@${victim}>**__ and decided to play a game of Russian Roulette. __**<@${victim}>**__ lost.`,
    ];

    const suicideMessages = [
        `💀 | __**<@${killer}>**__ was too scared to stay in the game and decided to end it all. What a coward.`,
        `💀 | __**<@${killer}>**__ was experimenting in creating a new type of weapon and it accidentally exploded on them.`,
        `💀 | __**<@${killer}>**__ was too hungry and decided to eat themselves. They were too tasty.`,
        `💀 | __**<@${killer}>**__ was too tired and decided to take a nap. They never woke up.`,
        `💀 | __**<@${killer}>**__ was too curious and wanted to see what would happen if they shot themself in the ear. They didn't survive.`,
        `💀 | __**<@${killer}>**__ was too thirsty and decided to drink a bottle of bleach nearby. Are they that stupid?`,
        `💀 | __**<@${killer}>**__ was too bored and decided to play Russian Roulette. They lost.`,
        `💀 | God realized he made a mistake when creating __**<@${killer}>**__. He undid his mistake.`,
        `💀 | What a terrible day to be alive. __**<@${killer}>**__ was obliterated by a falling meteor.`,
        `💀 | __**<@${killer}>**__ stumbled upon an aggressive, hungry bear. Needless to say, it didn't go very well.`,
        `💀 | __**<@${killer}>**__ choked while eating some nuts. They were too tasty.`,
        `💀 | __**<@${killer}>**__ thought it was a good idea to jump off a cliff. They were wrong.`,
        `💀 | Out of nowhere, a huge boulder fell on __**<@${killer}>**__. They were crushed to pieces.`,
        `💀 | Eating 400 bananas are the maximum to not die from potassium poisoning. __**<@${killer}>**__ ate 401 bananas. They died.`,
        `💀 | __**<@${killer}>**__ ate too much laxatives and ripped their own insides.`,
    ];

    const surviveMessages = [
        `🌳 | __**<@${killer}>**__ got a bit lost but found their way back. Good on them!`,
        `🌳 | __**<@${killer}>**__ was almost clawed apart by a panther but they luckily managed to escape. What a time to be alive.`,
        `🌳 | __**<@${killer}>**__ meditated in the waterfalls. It was very soothing.`,
        `🌳 | __**<@${killer}>**__ got bored and decided to play ping pong against a tree. They won.`,
        `🌳 | __**<@${killer}>**__ was so tired they napped for a few hours. What a sloth.`,
        `🌳 | __**<@${killer}>**__ had a mental breakdown but came back to their senses.`,
        `🌳 | __**<@${killer}>**__ fought a lion and somehow won. They are now temporarily the king of the jungle.`,
        `🌳 | __**<@${killer}>**__ was so hungry they ate a kilogram of grass. It gave them a lot of energy.`,
        `🌳 | __**<@${killer}>**__ wandered around and met a few monkeys. They are now best friends.`,
        `🌳 | __**<@${killer}>**__ stayed in their cave the whole day to avoid getting killed. What a coward.`,
        `🌳 | __**<@${killer}>**__ narrowly avoided getting obliterated by thunder. They are now a bit deaf.`,
        `🌳 | __**<@${killer}>**__ found some shiny armor near the lake. This should protect them for now.`,
        `🌳 | __**<@${killer}>**__ found some gold! Hopefully no one else paid attention.`,
    ];

    if (type === 'kill') {
        return killMessages[Math.floor(Math.random() * killMessages.length)];
    } else if (type === 'suicide') {
        return suicideMessages[Math.floor(Math.random() * suicideMessages.length)];
    } else {
        return surviveMessages[Math.floor(Math.random() * surviveMessages.length)];
    }
};

module.exports = {
    addNewGame,
    getCurrentHunterGamesId,
    addParticipant,
    deleteParticipants,
    getAllParticipants,
    refundEntranceFee,
    startHunterGames,
    getCurrentHunterGamesId,
};
