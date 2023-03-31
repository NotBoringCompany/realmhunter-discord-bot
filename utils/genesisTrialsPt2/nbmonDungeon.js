require('dotenv').config();
const permissions = require('../dbPermissions');
const { BossNBMonSchema, NBMonSchema, DiscordUserSchema } = require('../schemas');
const mongoose = require('mongoose');
const { generateObjectId } = require('../cryptoUtils');
const { bossHp, imageUrl } = require('./nbmonStatRandomizer');
const { checkXPAndUpgrade, xpToGive } = require('./nbmonStatCalc');
const { bossNBMonAppearanceEmbed, bossNBMonEmbed } = require('../../embeds/genesisTrialsPt2/nbmonAppearance');
const cron = require('node-cron');

/**
 * Adds a boss to the database when it appears.
 */
const addBoss = async (nbmonId) => {
    try {
        const BossNBMon = mongoose.model('NBMonBossData', BossNBMonSchema, 'RHDiscordBossNBMonData');
        const { _wperm, _rperm, _acl } = permissions(false, false);

        const getBossHp = await bossHp();

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
 * Called when `userId` uses `attackerId` (NBMON) to attack the most recent boss.
 */
const attackBoss = async (userId, attackerId) => {
    try {
        // checks if `userId` owns `attackerId`. if not, return error.
        const checkOwned = await checkIfOwned(userId, attackerId);

        if (!checkOwned) {
            return {
                status: 'error',
                message: 'You do not own this NBMon.',
            };
        }

        // check if user has already attacked the past 2 minutes.
        const { status: lastHitStatus, message: lastHitTimestamp } = await userLastHit(userId);

        if (lastHitStatus === 'error') {
            return {
                status: 'error',
                message: lastHitTimestamp,
            };
        }

        const BossNBMon = mongoose.model('NBMonBossData', BossNBMonSchema, 'RHDiscordBossNBMonData');
        const NBMon = mongoose.model('NBMonData', NBMonSchema, 'RHDiscordNBMonData');

        const bossQuery = await BossNBMon.findOne().sort({ nbmonId: -1 });
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
        if (attackerQuery.currentHp === 0) {
            return {
                status: 'error',
                message: 'You cannot use a currently knocked out NBMon.',
            };
        }

        if (bossQuery.hpLeft === 0) {
            return {
                status: 'error',
                message: 'The boss has already been defeated. Please wait for the next boss.',
            };
        }

        // we get the attacker NBMon's attack stat and the boss's hp stat.
        const attackStat = attackerQuery.atk;
        const bossHpStat = bossQuery.hpLeft;

        // get the attacker's custom name (if any)
        const attackerName = attackerQuery.customName ? attackerQuery.customName : `NBMon #${attackerId}`;

        // we calculate for the critical hit chance. 10% chance of a critical hit.
        const criticalHit = Math.floor(Math.random() * 10) + 1 === 1 ? true : false;

        // we calculate for the damage dealt.
        const damageDealt = criticalHit ? attackStat * 2 : attackStat;

        // if the damage dealt is greater than the boss's hp stat, then the boss dies after getting hit.
        // we will update a few things.
        if (damageDealt >= bossHpStat) {
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
                const damageDealtSoFar = bossQuery.damagedBy[userIndex].damageDealt;

                // else, we will update the `damageDealt` and `lastHitTimestamp` of the user.
                await BossNBMon.updateOne({ nbmonId: bossQuery.nbmonId, 'damagedBy.userId': userId }, { $set: { 'damagedBy.$.damageDealt': damageDealtSoFar + damageDealt, 'damagedBy.$.lastHitTimestamp': Math.floor(new Date().getTime() / 1000) } });
            }

            // we add userId to `defeatedBy` and set `hpLeft` to 0.
            bossQuery.defeatedBy = userId;
            bossQuery.hpLeft = 0;

            // since this is the final blow, we give the attacker the following xp (x4 damage dealt)
            const getXp = xpToGive(attackerQuery.xp, damageDealt * 10);

            // now, we check if the attacker NBMon can level up its attack and hp stat
            const { attackUpgrade, hpUpgrade } = checkXPAndUpgrade(attackerQuery.rarity, attackerQuery.xp, getXp);

            // we now give the XP and level up the attack stat of the attacker NBMon. (we will do so anyway since if no upgrade, `upgradeAttack` will return 0.)
            await NBMon.updateOne({ nbmonId: attackerId }, { $set: { xp: attackerQuery.xp + getXp, atk: attackerQuery.atk + attackUpgrade, maxHp: attackerQuery.maxHp + hpUpgrade } });

            // now, we give the realm points to the user based on the XP earned
            await rewardRealmPoints(userId, getXp);

            /// RETALIATION LOGIC:
            // 40% chance to damage 1 - 20% of the attacker's MAX HP.
            // 45% chance to damage 21 - 60% of the attacker's MAX HP.
            // 15% chance to damage 61 - 100% of the attacker's MAX HP.
            const retaliationChance = Math.floor(Math.random() * 100) + 1;
            let retaliationDamage;
            if (retaliationChance <= 40) {
                const retaliationDmgMultiplier = Math.random() * 0.2 + 0.01;
                retaliationDamage = Math.floor(attackerQuery.maxHp * retaliationDmgMultiplier);
            } else if (retaliationChance <= 85) {
                const retaliationDmgMultiplier = Math.random() * 0.4 + 0.21;
                retaliationDamage = Math.floor(attackerQuery.maxHp * retaliationDmgMultiplier);
            } else if (retaliationChance <= 100) {
                const retaliationDmgMultiplier = Math.random() * 0.4 + 0.61;
                retaliationDamage = Math.floor(attackerQuery.maxHp * retaliationDmgMultiplier);
            }

            if (retaliationDamage >= attackerQuery.currentHp) {
                attackerQuery.currentHp = 0;
                attackerQuery.lastFaintedTimestamp = Math.floor(new Date().getTime() / 1000);

                attackerQuery._updated_at = Date.now();
                bossQuery._updated_at = Date.now();

                await attackerQuery.save();
                await bossQuery.save();

                return {
                    status: 'success',
                    message: `<@${userId}>'s NBMon, **${attackerName}**, dealt the **FINAL BLOW** with __**${criticalHit ? 'a CRITICAL HIT with ' : ''}${damageDealt} damage**__ and earned ${getXp} XP. However, the boss retaliated and **knocked out** their NBMon with **${retaliationDamage}** damage!`,
                };
            // if the damage dealt by the boss is less than the attacker's HP, we will just update the attacker's HP.
            } else {
                attackerQuery.currentHp = attackerQuery.currentHp - retaliationDamage;

                attackerQuery._updated_at = Date.now();
                bossQuery._updated_at = Date.now();

                await attackerQuery.save();
                await bossQuery.save();

                return {
                    status: 'success',
                    message: `<@${userId}>'s NBMon, **${attackerName}**, dealt the **FINAL BLOW** with __**${criticalHit ? 'a CRITICAL HIT with ' : ''}${damageDealt} damage**__ and earned ${getXp} XP. However, the boss retaliated and dealt **${retaliationDamage}** damage to their NBMon!`,
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
                const damageDealtSoFar = bossQuery.damagedBy[userIndex].damageDealt;

                // else, we will update the `damageDealt` and `lastHitTimestamp` of the user.
                await BossNBMon.updateOne({ nbmonId: bossQuery.nbmonId, 'damagedBy.userId': userId }, { $set: { 'damagedBy.$.damageDealt': damageDealtSoFar + damageDealt, 'damagedBy.$.lastHitTimestamp': Math.floor(new Date().getTime() / 1000) } });
            }

            //  we give the attacker the following xp.
            const getXp = xpToGive(attackerQuery.xp, damageDealt * 4);

            // now, we check if the attacker NBMon can level up its attack and hp stat
            const { attackUpgrade, hpUpgrade } = checkXPAndUpgrade(attackerQuery.rarity, attackerQuery.xp, getXp);

            // we reduce the boss hp by `damageDealt`.
            bossQuery.hpLeft -= damageDealt;

            // we now give the XP and level up the attack stat of the attacker NBMon. (we will do so anyway since if no upgrade, `upgradeAttack` will return 0.)
            await NBMon.updateOne({ nbmonId: attackerId }, { $set: { xp: attackerQuery.xp + getXp, atk: attackerQuery.atk + attackUpgrade, maxHp: attackerQuery.maxHp + hpUpgrade } });

            // now, we give the realm points to the user based on the XP earned
            await rewardRealmPoints(userId, getXp);

            /// RETALIATION LOGIC:
            // 40% chance to damage 1 - 20% of the attacker's MAX HP.
            // 45% chance to damage 21 - 60% of the attacker's MAX HP.
            // 15% chance to damage 61 - 100% of the attacker's MAX HP.
            const retaliationChance = Math.floor(Math.random() * 100) + 1;
            let retaliationDamage;
            if (retaliationChance <= 40) {
                const retaliationDmgMultiplier = Math.random() * 0.2 + 0.01;
                retaliationDamage = Math.floor(attackerQuery.maxHp * retaliationDmgMultiplier);
            } else if (retaliationChance <= 85) {
                const retaliationDmgMultiplier = Math.random() * 0.4 + 0.21;
                retaliationDamage = Math.floor(attackerQuery.maxHp * retaliationDmgMultiplier);
            } else if (retaliationChance <= 100) {
                const retaliationDmgMultiplier = Math.random() * 0.4 + 0.61;
                retaliationDamage = Math.floor(attackerQuery.maxHp * retaliationDmgMultiplier);
            }

            if (retaliationDamage >= attackerQuery.currentHp) {
                attackerQuery.currentHp = 0;
                attackerQuery.lastFaintedTimestamp = Math.floor(new Date().getTime() / 1000);

                attackerQuery._updated_at = Date.now();
                bossQuery._updated_at = Date.now();

                await attackerQuery.save();
                await bossQuery.save();

                return {
                    status: 'success',
                    message: `<@${userId}>'s NBMon, **${attackerName}**, dealt __**${criticalHit ? 'a CRITICAL HIT with ' : ''}${damageDealt} damage**__ and earned ${getXp} XP. However, the boss retaliated and __**knocked out**__ their NBMon with **${retaliationDamage}** damage!`,
                };
            // if the damage dealt by the boss is less than the attacker's HP, we will just update the attacker's HP.
            } else {
                attackerQuery.currentHp = attackerQuery.currentHp - retaliationDamage;

                attackerQuery._updated_at = Date.now();
                bossQuery._updated_at = Date.now();

                await attackerQuery.save();
                await bossQuery.save();

                return {
                    status: 'success',
                    message: `<@${userId}>'s NBMon, **${attackerName}**, dealt __**${criticalHit ? 'a CRITICAL HIT with ' : ''}${damageDealt} damage**__ and earned ${getXp} XP. However, the boss retaliated and dealt **${retaliationDamage}** damage to their NBMon!`,
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
 * Rewards the user with Realm Points after successfully attacking a boss.
 */
const rewardRealmPoints = async (userId, realmPoints) => {
    try {
        const User = mongoose.model('User', DiscordUserSchema, 'RHDiscordUserData');
        const userQuery = await User.findOne({ userId: userId });

        const { _wperm, _rperm, _acl } = permissions(true, false);

        // if query isn't found, (we will create a new user.). safety mechanism to prevent error.
        // however, this shouldn't happen anyway since the user shouldve already been created when having an nbmon.
        if (!userQuery) {
            const NewUser = new User(
                {
                    _id: generateObjectId(),
                    _created_at: Date.now(),
                    _updated_at: Date.now(),
                    _wperm: _wperm,
                    _rperm: _rperm,
                    _acl: _acl,
                    userId: userId,
                    realmPoints: realmPoints,
                },
            );

            await NewUser.save();

            return {
                status: 'success',
                message: `Successfully rewarded <@${userId}> with ${realmPoints} Gatekeeper's Favor Points.`,
            };
        } else {
            // otherwise, if it exists, we will update the user's realm points.
            if (userQuery.realmPoints) {
                userQuery.realmPoints += realmPoints;
            } else {
                userQuery.realmPoints = realmPoints;
            }

            userQuery._updated_at = Date.now();
            await userQuery.save();

            return {
                status: 'success',
                message: `Successfully rewarded <@${userId}> with ${realmPoints} Gatekeeper's Favor Points.`,
            };
        };
    } catch (err) {
        console.log({
            errorFrom: 'rewardRealmPoints',
            errorMessage: err,
        });
    }
};

/**
 * Checks whether the user has already hit the most recent boss within the past 2 minutes.
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
        // otherwise, we get the last hit timestamp and check if it's within the past 2 minutes.
        } else {
            const now = Math.floor(new Date().getTime() / 1000);
            const lastHitTimestamp = damagedBy[userIndex].lastHitTimestamp;

            if (now - lastHitTimestamp <= 120) {
                return {
                    status: 'error',
                    message: 'You have already attacked the boss within the past 2 minutes. Please wait a while before attacking again.',
                };
            } else {
                return {
                    status: 'success',
                    message: 'You have not attacked the boss within the past 2 minutes.',
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
 * 2. The appearance between the previous boss and the current boss must be more than 5 hours.
 */
const allowNextBossAppearance = async () => {
    try {
        const bossDefeated = await checkBossDefeated();
        const prevAppearance = await prevBossAppearance();
        const now = Math.floor(new Date().getTime() / 1000);

        if (!bossDefeated) {
            return {
                status: 'error',
                message: `A new boss wants to be challenged but the previous boss has not yet been defeated. Defeat it in <#${process.env.REALM_DUNGEON_PVE_CHANNELID}> to allow the next boss to appear soon.`,
                canAppear: false,
            };
        };

        if (bossDefeated && now - prevAppearance < 18000) {
            return {
                status: 'error',
                message: `Boss cannot appear yet.`,
                canAppear: false,
            };
        }

        if (bossDefeated && now - prevAppearance >= 18000) {
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
        const statsMsg = await client.channels.cache.get(process.env.REALM_DUNGEON_PVE_CHANNELID).send({
            embeds: [bossNBMonEmbed(newBossId, imageUrl('scorpio'), bossHp, bossHp, 0)],
            components: [
                {
                    type: 1,
                    components: bossFightButtons(newBossId),
                },
            ],
        });

        // 3. add the boss appearance embed to the general chat.
        const appearanceMsg = await client.channels.cache.get(process.env.GENERAL_CHAT_CHANNELID).send({
            embeds: [bossNBMonAppearanceEmbed(newBossId, imageUrl('scorpio'))],
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

/**
 * Get owned NBMon IDs from `userId` and return it as a message.
 */
const getOwnedNBMonIds = async (userId) => {
    try {
        const NBMon = mongoose.model('NBMonData', NBMonSchema, 'RHDiscordNBMonData');
        const nbmonQuery = await NBMon.find({ capturedBy: userId, disowned: false });

        let ownedIds = '';

        if (!nbmonQuery) {
            ownedIds = 'No NBMons owned. Capture or buy some from the shop.';
        } else {
            nbmonQuery.forEach((nbmon) => {
                ownedIds += `${nbmon.nbmonId}, `;
            });
        }

        return ownedIds;
    } catch (err) {
        console.log({
            errorFrom: 'getOwnedNBMonIds',
            errorMessage: err,
        });
    }
};

/**
 * When the user wants to attack with this NBMon Id, check if it's owned by the user.
 * if not, throw an error.
 */
const checkIfOwned = async (userId, nbmonId) => {
    try {
        const NBMon = mongoose.model('NBMonData', NBMonSchema, 'RHDiscordNBMonData');
        const nbmonQuery = await NBMon.findOne({ nbmonId: nbmonId });

        if (!nbmonQuery) {
            return false;
        }

        if (nbmonQuery.capturedBy !== userId) {
            return false;
        }

        return true;
    } catch (err) {
        console.log({
            errorFrom: 'checkIfOwned',
            errorMessage: err,
        });
    }
};

/**
 * Gets how much damage the user has dealt to the current boss.
 */
const damageDealt = async (userId) => {
    try {
        const BossNBMon = mongoose.model('NBMonBossData', BossNBMonSchema, 'RHDiscordBossNBMonData');
        const bossQuery = await BossNBMon.findOne().sort({ nbmonId: -1 });

        if (!bossQuery) {
            return `You have dealt 0 damage to Boss #${bossQuery.nbmonId}.`;
        }

        const damagedBy = bossQuery.damagedBy;

        // find the user data in the damagedBy array.
        const userDamageData = damagedBy.find((data) => data.userId === userId);

        return `You have dealt ${userDamageData.damageDealt ? userDamageData.damageDealt : 0} damage to Boss #${bossQuery.nbmonId}.`;
    } catch (err) {
        console.log({
            errorFrom: 'damageDealt',
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
            label: 'Check your owned NBMon IDs',
            custom_id: 'checkNBMonsOwnedButton',
        },
        {
            type: 2,
            style: 1,
            label: 'Revive knocked out NBMons',
            custom_id: 'reviveNBMonsButton',
        },
        {
            type: 2,
            style: 1,
            label: 'Check your damage dealt',
            custom_id: 'checkDamageDealtButton',
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
        const bossQuery = await BossNBMon.findOne({}).sort({ nbmonId: -1 });

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

        const dungeonChannel = await client.channels.fetch(process.env.REALM_DUNGEON_PVE_CHANNELID);
        const statEmbed = await dungeonChannel.messages.fetch(statMsgId);

        if (!statEmbed) {
            return {
                status: 'error',
                message: 'Stat embed not found.',
            };
        }

        await statEmbed.edit({
            embeds: [bossNBMonEmbed(currentId, imageUrl('scorpio'), currentHp.toString(), maxHp.toString(), attackedBy)],
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
 * Users can call this function to revive their knocked out NBMons.
 * Revives only work if the time difference between now and the last fainted timestamp is >= 20 mins.
 */
const reviveUserKnockedOutNBMons = async (userId) => {
    try {
        const NBMon = mongoose.model('NBMonData', NBMonSchema, 'RHDiscordNBMonData');
        const nbmonQuery = await NBMon.find({ capturedBy: userId, currentHp: 0 });

        if (!nbmonQuery) {
            return {
                status: 'error',
                message: 'You don\'t have any knocked out NBMons or you don\'t own any NBMons.',
            };
        }

        const nbmonsRevived = [];

        const now = Math.floor(new Date().getTime() / 1000);
        for (let i = 0; i < nbmonQuery.length; i++) {
            const nbmon = nbmonQuery[i];

            const lastFainted = nbmon.lastFaintedTimestamp;

            if (now - lastFainted > 1200) {
                const maxHp = nbmon.maxHp;

                // revive the nbmons to 50% of their max HP.
                const reviveHp = Math.floor(maxHp * 0.333);
                nbmon.currentHp = reviveHp;
                nbmon._updated_at = Date.now();

                nbmonsRevived.push(nbmon.nbmonId);

                await nbmon.save();
            }
        }

        if (nbmonsRevived.length === 0) {
            return {
                status: 'error',
                message: 'None of your NBMons are knocked out or you haven\'t waited 20 minutes since they were knocked out.',
            };
        }

        return {
            status: 'success',
            message: `Revived NBMons: ${nbmonsRevived.join(', ')}. 33.3% of their max HP has been restored.`,
        };
    } catch (err) {
        console.log({
            errorFrom: 'reviveUserKnockedOutNBMons',
            errorMessage: err,
        });
    }
};


/**
 * A scheduler to run every 10 minutes that gives a 1% chance of a boss appearing every 10 minutes.
 * If the chance hits but the previous boss is not yet defeated, throw a message saying to defeat the boss.
 * If the chance doesn't hit and the boss is defeated and the time between the current and previous boss is more than 5 hours, we let the boss appear.
 */
const bossAppearanceScheduler = async (client) => {
    try {
        // run every 10 minutes
        cron.schedule('*/10 * * * *', async () => {
            // 1% chance of boss appearing each 10 minutes.
            const rand = Math.floor(Math.random() * 100) + 1;

            console.log('boss appearance rand: ', rand);

            const now = Math.floor(new Date().getTime() / 1000);
            const prevAppearance = await prevBossAppearance();

            const isOver6Hours = now - prevAppearance >= 21600;

            console.log('isOver6Hours: ', isOver6Hours);

            // if rand = 1 or its already 6 hours since the previous boss appearance, run the bossAppears function.
            // if the prev boss hasn't been defeated, `bossAppears` will return an error status.
            if (rand === 1 || isOver6Hours) {
                const { status, message } = await bossAppears(client);

                if (status === 'error') {
                    // we don't need to show this message in general chat.
                    if (message !== 'Boss cannot appear yet.' || message !== 'Error while retrieving boss data.') {
                        await client.channels.cache.get(process.env.GENERAL_CHAT_CHANNELID).send(message);
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

/**
 * Updates the boss stat embed every 30 seconds.
 */
const updateBossStatEmbedScheduler = async (client) => {
    try {
        cron.schedule('*/30 * * * * *', async () => {
            const { message } = await updateBossStatEmbed(client);
            console.log(message);
        });
    } catch (err) {
        console.log({
            errorFrom: 'updateBossStatEmbedScheduler',
            errorMessage: err,
        });
    }
};

module.exports = {
    addBoss,
    attackBoss,
    checkBossDefeated,
    getOwnedNBMonIds,
    getLatestBossId,
    userLastHit,
    bossAppears,
    updateBossStatEmbed,
    bossAppearanceScheduler,
    checkIfOwned,
    reviveUserKnockedOutNBMons,
    updateBossStatEmbedScheduler,
    damageDealt,
};
