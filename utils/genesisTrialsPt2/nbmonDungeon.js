require('dotenv').config();
const permissions = require('../dbPermissions');
const { BossNBMonSchema, NBMonSchema } = require('../schemas');
const mongoose = require('mongoose');
const { generateObjectId } = require('../cryptoUtils');
const { bossHp } = require('./nbmonStatRandomizer');
const { checkXPAndUpgrade } = require('./nbmonStatCalc');

mongoose.connect(process.env.MONGODB_URI);

/**
 * Adds a boss to the database when it appears.
 */
const addBoss = async (nbmonId) => {
    try {
        const BossNBMon = mongoose.model('NBMonBossData', BossNBMonSchema, 'RHDiscordBossNBMonData');
        const { _wperm, _rperm, _acl } = permissions(false, false);

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
                hpLeft: bossHp(),
            },
        );

        await NewBoss.save();

        return {
            status: 'success',
            message: 'Boss added to database.',
        };
    } catch (err) {
        console.log({
            errorFrom: 'addBoss',
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
        if (attackerQuery.stats.hp === 0) {
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
                attackerQuery.stats.hp = 0;

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
                attackerQuery.stats.hp = 0;

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

module.exports = {
    addBoss,
    attackBoss,
};
