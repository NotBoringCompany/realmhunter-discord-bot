require('dotenv').config();
const permissions = require('../dbPermissions');
const { BossNBMonSchema, NBMonSchema } = require('../schemas');
const mongoose = require('mongoose');
const { generateObjectId } = require('../cryptoUtils');
const { bossHp } = require('./nbmonStatRandomizer');
const { checkXPAndUpgrade } = require('./nbmonStatCalc');
const { bossNBMonAppearanceEmbed, bossNBMonEmbed } = require('../../embeds/genesisTrialsPt2/nbmonAppearance');
const cron = require('node-cron');

/**
 * Adds a boss to the database when it appears.
 */
const addBoss = async (nbmonId) => {
    try {
        const BossNBMon = mongoose.model('NBMonBossData', BossNBMonSchema, 'RHDiscordBossNBMonData');
        const { _wperm, _rperm, _acl } = permissions(false, false);

        const getBossHp = bossHp();

        const NewBoss = new BossNBMon(
            {
                _id: generateObjectId(),
                _created_at: Date.now(),
                _updated_at: Date.now(),
                _wperm: _wperm,
                _rperm: _rperm,
                _acl: _acl,
                nbmonId: nbmonId,
                appearanceTimestamp: Math.floor(new Date().getTime() / 1000),
                totalHp: getBossHp,
                hpLeft: getBossHp,
            },
        );

        await NewBoss.save();

        return {
            status: 'success',
            message: 'Boss added to database.',
            bossHp: getBossHp,
        };
    } catch (err) {
        console.log({
            errorFrom: 'addBoss',
            errorMessage: err,
        });
    }
};

/**
 * Appends the appearance and stats message IDs to be edited later on for the boss, either the most recent one or `nbmonId`.
 */
const appendMsgIds = async (nbmonId, appearanceMsgId, statsMsgId) => {
    try {
        const BossNBMon = mongoose.model('NBMonBossData', BossNBMonSchema, 'RHDiscordBossNBMonData');
        let bossQuery;

        if (nbmonId) {
            bossQuery = await BossNBMon.findOne({ nbmonId: nbmonId });
        } else {
            bossQuery = await BossNBMon.findOne().sort({ nbmonId: -1 });
        }

        if (!bossQuery) {
            return {
                status: 'error',
                message: 'Error while retrieving boss data.',
            };
        }

        bossQuery.bossAppearanceMsgId = appearanceMsgId;
        bossQuery.bossStatsMsgId = statsMsgId;

        await bossQuery.save();

        return {
            status: 'success',
            message: 'Boss appearance and stats message IDs appended to database.',
        };
    } catch (err) {
        console.log({
            errorFrom: 'appendMsgIds',
            errorMessage: err,
        });
    }
};

/**
 * Called when `userId` uses `attackerId` (NBMON) to attack `bossId`.
 */
const attackBoss = async (userId, bossId, attackerId) => {
    try {
        const BossNBMon = mongoose.model('NBMonBossData', BossNBMonSchema, 'RHDiscordBossNBMonData');
        const NBMon = mongoose.model('NBMonData', NBMonSchema, 'RHDiscordNBMonData');

        const bossQuery = await BossNBMon.findOne({ nbmonId: bossId });
        const attackerQuery = await NBMon.findOne({ nbmonId: attackerId });

        if (!bossQuery) {
            return {
                status: 'error',
                message: 'Error while retrieving boss data.',
            };
        }

        if (!attackerQuery) {
            return {
                status: 'error',
                message: 'Error while retrieving attacker NBMon data.',
            };
        }

        // first, we check if the attacker NBMon has 0 hp. if it does, we return an error.
        if (attackerQuery.fainted) {
            return {
                status: 'error',
                message: 'You cannot use a currently knocked out NBMon.',
            };
        }

        // we get the attacker NBMon's attack stat and the boss's hp stat.
        const attackStat = attackerQuery.stats.atk;
        const bossHpStat = bossQuery.hpLeft;

        // we calculate for the critical hit chance. 10% chance of a critical hit.
        const criticalHit = Math.floor(Math.random() * 10) + 1 === 1 ? true : false;

        // we calculate for the damage dealt.
        const damageDealt = criticalHit ? attackStat * 2 : attackStat;

        // if the damage dealt is greater than the boss's hp stat, then the boss dies after getting hit.
        // we will update a few things.
        if (damageDealt > bossHpStat) {
            // we first add the data to `damagedBy`. we check if the user has already attacked the boss before.
            // if yes, we add the damage dealt to the previous damage dealt.
            // if no, we add the damage dealt to the array.
            const damagedBy = bossQuery.damagedBy;
            const userIndex = damagedBy.findIndex((data) => data.userId === userId);

            // if user hasn't attacked before, we add the data to the array.
            if (userIndex === -1) {
                const data = {
                    userId: userId,
                    damageDealt: damageDealt,
                    lastHitTimestamp: Math.floor(new Date().getTime() / 1000),
                };

                bossQuery.damagedBy.push(data);
            } else {
                // if user has attacked before, we add the damage dealt to the previous damage dealt.
                bossQuery.damagedBy[userIndex].damageDealt += damageDealt;
                bossQuery.damagedBy[userIndex].lastHitTimestamp = Math.floor(new Date().getTime() / 1000);
            }

            // we add userId to `defeatedBy` and set `hpLeft` to 0.
            bossQuery.defeatedBy = userId;
            bossQuery.hpLeft = 0;

            // since this is the final blow, we give the attacker `damageDealt` + 50 XP.
            const xpToGive = damageDealt + 50;

            // now, we check if the attacker NBMon can level up its attack stat.
            const upgradeAttack = checkXPAndUpgrade(attackerQuery.stats.xp, xpToGive);

            // we now give the XP and level up the attack stat of the attacker NBMon. (we will do so anyway since if no upgrade, `upgradeAttack` will return 0.)
            attackerQuery.stats.xp += xpToGive;
            attackerQuery.stats.atk += upgradeAttack;

            // now, there's still a 30% chance that the boss retaliates. if so, the attacker gets knocked out.
            const retaliation = Math.floor(Math.random() * 10) + 1 <= 3 ? true : false;

            if (retaliation) {
                attackerQuery.lastFaintedTimestamp = Math.floor(new Date().getTime() / 1000);
                attackerQuery.fainted = true;

                await attackerQuery.save();
                await bossQuery.save();

                return {
                    status: 'success',
                    message: `<@${userId}> has dealt the final blow to the boss by dealing ${criticalHit ? 'a CRITICAL HIT with' : ''} ${damageDealt} damage. However, the boss retaliated with its remaining strength and knocked out ${attackerId} afterwards!`,
                };
            } else {
                await attackerQuery.save();
                await bossQuery.save();

                return {
                    status: 'success',
                    message: `<@${userId}> has dealt the final blow to the boss by dealing ${criticalHit ? 'a CRITICAL HIT with' : ''} ${damageDealt} damage.`,
                };
            }
        // if the boss still has hp left, we will update a few things.
        } else {
            // we first check if the user has already attacked the boss before.
            // if yes, we add the damage dealt to the previous damage dealt.
            // if no, we add the damage dealt to the array.
            const damagedBy = bossQuery.damagedBy;
            const userIndex = damagedBy.findIndex((data) => data.userId === userId);

            // if user hasn't attacked before, we add the data to the array.
            if (userIndex === -1) {
                const data = {
                    userId: userId,
                    damageDealt: damageDealt,
                    lastHitTimestamp: Math.floor(new Date().getTime() / 1000),
                };

                bossQuery.damagedBy.push(data);
            // if user has attacked before, we add the damage dealt to the previous damage dealt.
            } else {
                bossQuery.damagedBy[userIndex].damageDealt += damageDealt;
                bossQuery.damagedBy[userIndex].lastHitTimestamp = Math.floor(new Date().getTime() / 1000);
            }

            // we give the attacker `damageDealt` XP.
            const xpToGive = damageDealt;

            // now, we check if the attacker NBMon can level up its attack stat.
            const upgradeAttack = checkXPAndUpgrade(attackerQuery.stats.xp, xpToGive);

            // we now give the XP and level up the attack stat of the attacker NBMon. (we will do so anyway since if no upgrade, `upgradeAttack` will return 0.)
            attackerQuery.stats.xp += xpToGive;
            attackerQuery.stats.atk += upgradeAttack;

            // now, there's still a 30% chance that the boss retaliates. if so, the attacker gets knocked out.
            const retaliation = Math.floor(Math.random() * 10) + 1 <= 3 ? true : false;

            if (retaliation) {
                attackerQuery.lastFaintedTimestamp = Math.floor(new Date().getTime() / 1000);
                attackerQuery.fainted = true;

                await attackerQuery.save();
                await bossQuery.save();

                return {
                    status: 'success',
                    message: `<@${userId}> has dealt ${criticalHit ? 'a CRITICAL HIT with' : ''} ${damageDealt} damage to the boss. However, the boss retaliated with its remaining strength and knocked out ${attackerId} afterwards!`,
                };
            } else {
                await attackerQuery.save();
                await bossQuery.save();

                return {
                    status: 'success',
                    message: `<@${userId}> has dealt ${criticalHit ? 'a CRITICAL HIT with' : ''} ${damageDealt} damage to the boss with NBMon #${attackerId}.`,
                };
            }
        }
    } catch (err) {
        console.log({
            errorFrom: 'attackBoss',
            errorMessage: err,
        });
    }
};

/**
 * Checks if the previous NBMon has been defeated (or NBMon `id` if specified).
 */
const checkBossDefeated = async (nbmonId) => {
    try {
        const BossNBMon = mongoose.model('NBMonBossData', BossNBMonSchema, 'RHDiscordBossNBMonData');
        let bossQuery;

        if (nbmonId) {
            bossQuery = await BossNBMon.findOne({ nbmonId: nbmonId });
        // if not specified, sort in descending order and get the first one.
        } else {
            bossQuery = await BossNBMon.findOne().sort({ nbmonId: -1 });
        }

        if (!bossQuery) {
            return true;
        } else {
            return bossQuery.hpLeft === 0 ? true : false;
        }
    } catch (err) {
        console.log({
            errorFrom: 'checkBossDefeated',
            errorMessage: err,
        });
    }
};

/**
 * Checks whether the user has already hit the most recent boss within the past 5 minutes.
 */
const userLastHit = async (userId) => {
    try {
        const BossNBMon = mongoose.model('NBMonBossData', BossNBMonSchema, 'RHDiscordBossNBMonData');
        const bossQuery = await BossNBMon.findOne().sort({ nbmonId: -1 });

        if (!bossQuery) {
            return {
                status: 'error',
                message: 'Error getting latest boss. Please report this to the developers.',
            };
        }

        const damagedBy = bossQuery.damagedBy;

        // now we check if the user has already attacked the boss before.
        const userIndex = damagedBy.findIndex((data) => data.userId === userId);

        if (userIndex === -1) {
            return {
                status: 'success',
                message: 'You have not attacked the boss before.',
            };
        // otherwise, we get the last hit timestamp and check if it's within the past 5 minutes.
        } else {
            const now = Math.floor(new Date().getTime() / 1000);
            const lastHitTimestamp = damagedBy[userIndex].lastHitTimestamp;

            if (now - lastHitTimestamp <= 300) {
                return {
                    status: 'error',
                    message: 'You have already attacked the boss within the past 5 minutes. Please wait a while before attacking again.',
                };
            }
        }
    } catch (err) {
        console.log({
            errorFrom: 'userLastHit',
            errorMessage: err,
        });
    }
};

/**
 * Gets the timestamp of when the previous boss appeared.
 */
const prevBossAppearance = async () => {
    try {
        const Boss = mongoose.model('BossData', BossNBMonSchema, 'RHDiscordBossNBMonData');
        const bossQuery = await Boss.findOne().sort({ nbmonId: -1 });

        if (!bossQuery) {
            return 0;
        } else {
            return bossQuery.appearanceTimestamp;
        }
    } catch (err) {
        console.log({
            errorFrom: 'prevBossAppearance',
            errorMessage: err,
        });
    }
};

/**
 * Checks if the next boss can appear.
 * In order for the boss to appear:
 * 1. The previous boss must be defeated.
 * 2. The appearance between the previous boss and the current boss must be more than 8 hours.
 */
const allowNextBossAppearance = async () => {
    try {
        const bossDefeated = await checkBossDefeated();
        const prevAppearance = await prevBossAppearance();
        const now = Math.floor(new Date().getTime() / 1000);

        if (!bossDefeated) {
            return {
                status: 'error',
                message: `A new boss wants to be challenged but the previous boss has not yet been defeated. \n
                Defeat it in <#${process.env.FOUNDERS_BOT_COMMANDS_CHANNELID}> to allow the next boss to appear soon.`,
                canAppear: false,
            };
        };

        if (bossDefeated && now - prevAppearance < 28800) {
            return {
                status: 'error',
                message: `Boss cannot appear yet.`,
                canAppear: false,
            };
        }

        if (bossDefeated && now - prevAppearance >= 28800) {
            return {
                status: 'success',
                message: 'Boss can appear.',
                canAppear: true,
            };
        }
    } catch (err) {
        console.log({
            errorFrom: 'allowNextBossAppearance',
            errorMessage: err,
        });
    }
};

/**
 * Gets the latest boss ID.
 */
const getLatestBossId = async () => {
    try {
        const BossNBMon = mongoose.model('NBMonBossData', BossNBMonSchema, 'RHDiscordBossNBMonData');
        const bossQuery = await BossNBMon.findOne().sort({ nbmonId: -1 });

        if (!bossQuery) {
            return 0;
        }

        return bossQuery.nbmonId;
    } catch (err) {
        console.log({
            errorFrom: 'getLatestBossId',
            errorMessage: err,
        });
    }
};

/**
 * Gets called when a boss wants to appear. Throw an error if it can't, or run the remaining logic if it can.
 */
const bossAppears = async (client) => {
    try {
        const { message, canAppear } = await allowNextBossAppearance();
        if (!canAppear) {
            return {
                status: 'error',
                message: message,
            };
        }

        // if it can appear, we do two things:
        // 1. add the boss to the database
        // 2. add the boss embed to the dungeon channel
        // 3. add the boss appearance embed to the general chat.
        // 4. update the msg IDs in the database.

        // 1. add the boss to the database
        const latestBossId = await getLatestBossId();
        const newBossId = latestBossId + 1;
        const { bossHp } = await addBoss(newBossId);

        // 2. add the boss embed to the dungeon channel
        // for TESTING, IT WILL BE IN FOUNDERS BOT COMMANDS!
        const statsMsg = await client.channels.cache.get(process.env.FOUNDERS_BOT_COMMANDS_CHANNELID).send({
            embeds: [bossNBMonEmbed(newBossId, 'https://i.imgur.com/ICTeV6L.jpg', bossHp, bossHp, 0)],
            components: [
                {
                    type: 1,
                    components: bossFightButtons(newBossId),
                },
            ],
        });

        // 3. add the boss appearance embed to the general chat.
        // for TESTING, IT WILL BE IN TEST GENERAL CHAT!
        const appearanceMsg = await client.channels.cache.get(process.env.TEST_GENERAL_CHAT_CHANNELID).send({
            embeds: [bossNBMonAppearanceEmbed(newBossId, 'https://i.imgur.com/ICTeV6L.jpg')],
        });

        // 4. update the msg IDs in the database.
        const { status, message: appendMsg } = await appendMsgIds(newBossId, appearanceMsg.id, statsMsg.id);

        if (status === 'error') {
            return {
                status: 'error',
                message: appendMsg,
            };
        }

        return {
            status: 'success',
            message: 'Boss has appeared.',
        };
    } catch (err) {
        console.log({
            errorFrom: 'bossAppears',
            errorMessage: err,
        });
    }
};

const bossFightButtons = (currentBossId) => {
    return [
        {
            type: 2,
            style: 1,
            label: 'Attack',
            custom_id: `attackBossButton${currentBossId}`,
        },
        {
            type: 2,
            style: 1,
            label: 'Check owned NBMon IDs',
            custom_id: 'checkNBMonsOwnedButton',
        },
    ];
};

/**
 * Updates the boss stats embed (will have a scheduler that calls it every 30 seconds.)
 */
const updateBossStatEmbed = async (client) => {
    try {
        // get current stats of the boss.
        const BossNBMon = mongoose.model('NBMonBossData', BossNBMonSchema, 'RHDiscordBossNBMonData');
        const bossQuery = await BossNBMon.findOne().sort({ nbmonId: -1 });

        if (!bossQuery) {
            return {
                status: 'error',
                message: 'Boss not found.',
            };
        }

        // get the stats
        const currentId = bossQuery.nbmonId;
        const currentHp = bossQuery.hpLeft;
        const maxHp = bossQuery.totalHp;
        const attackedBy = bossQuery.damagedBy.length;
        const statMsgId = bossQuery.bossStatsMsgId;

        const dungeonChannel = await client.channels.fetch(process.env.FOUNDERS_BOT_COMMANDS_CHANNELID);
        const statEmbed = await dungeonChannel.messages.fetch(statMsgId);

        if (!statEmbed) {
            return {
                status: 'error',
                message: 'Stat embed not found.',
            };
        }

        await statEmbed.edit({
            embeds: [bossNBMonEmbed(currentId, 'https://i.imgur.com/ICTeV6L.jpg', currentHp.toString(), maxHp.toString(), attackedBy)],
            components: [
                {
                    type: 1,
                    components: bossFightButtons(currentId),
                },
            ],
        });

        return {
            status: 'success',
            message: 'Boss stats embed updated.',
        };
    } catch (err) {
        console.log({
            errorFrom: 'updateBossStatEmbed',
            errorMessage: err,
        });
    }
};


/**
 * A scheduler to run every minute that gives a 0.1% chance of a boss appearing.
 * If the chance hits but the previous boss is not yet defeated, throw a message saying to defeat the boss.
 * If the chance doesn't hit and the boss is defeated and the time between the current and previous boss is more than 8 hours, we let the boss appear.
 */
const bossAppearanceScheduler = async (client) => {
    try {
        cron.schedule('* * * * *', async () => {
            // 0.1% chance of appearing each minute.
            const rand = Math.floor(Math.random() * 1000) + 1;

            console.log('boss appearance rand: ', rand);

            const now = Math.floor(new Date().getTime() / 1000);
            const prevAppearance = await prevBossAppearance();

            const isOver8Hours = now - prevAppearance >= 28800;

            // if rand = 1 or its already 8 hours since the previous boss appearance, run the bossAppears function.
            // if the prev boss hasn't been defeated, `bossAppears` will return an error status.
            if (rand === 1 || isOver8Hours) {
                const { status, message } = await bossAppears(client);

                if (status === 'error') {
                    // we don't need to show this message in general chat.
                    if (message !== 'Boss cannot appear yet.' || message !== 'Error while retrieving boss data.') {
                        await client.channels.cache.get(process.env.TEST_GENERAL_CHAT_CHANNELID).send(message);
                    } else {
                        console.log(message);
                    }
                }
            }
        });
    } catch (err) {
        console.log({
            errorFrom: 'bossAppearanceScheduler',
            errorMessage: err,
        });
    }
};

module.exports = {
    addBoss,
    attackBoss,
    checkBossDefeated,
    userLastHit,
    bossAppears,
    updateBossStatEmbed,
    bossAppearanceScheduler,
};
