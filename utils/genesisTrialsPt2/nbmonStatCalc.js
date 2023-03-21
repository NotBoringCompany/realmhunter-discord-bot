/**
 * NBMon gets its attack and hp stat upgraded every 100 XP.
 * If current XP + xpToGive / 100 is a whole number newer than the current upgrade level, upgrade the stats
 * e.g. current upgrade level is 1. current XP is 100. xpToGive is 100. 100 + 100 / 100 = 2. 2 is newer than 1. upgrade the stats
 * stats increased in based on rarity.
 */
const checkXPAndUpgrade = (rarity, currentXp, xpToGive) => {
    try {
        let attackUpgrade;
        let hpUpgrade;
        const currentUpgradeLevel = Math.floor(currentXp / 100);
        const newUpgradeLevel = Math.floor((currentXp + xpToGive) / 100);

        switch (rarity.toLowerCase()) {
            case 'common':
                // 1 - 2
                attackUpgrade = Math.floor(Math.random() * 3) + 1;
                // 1 - 3
                hpUpgrade = Math.floor(Math.random() * 5) + 1;
                break;
            case 'uncommon':
                // 1 - 3
                attackUpgrade = Math.floor(Math.random() * 5) + 1;
                // 1 - 5
                hpUpgrade = Math.floor(Math.random() * 5) + 2;
                break;
            case 'rare':
                // 2 - 4
                attackUpgrade = Math.floor(Math.random() * 6) + 2;
                // 2 - 6
                hpUpgrade = Math.floor(Math.random() * 6) + 3;
                break;
            case 'epic':
                // 2 - 6
                attackUpgrade = Math.floor(Math.random() * 7) + 4;
                // 3 - 7
                hpUpgrade = Math.floor(Math.random() * 8) + 5;
                break;
            case 'legendary':
                // 3 - 7
                attackUpgrade = Math.floor(Math.random() * 8) + 5;
                // 4 - 8
                hpUpgrade = Math.floor(Math.random() * 10) + 6;
                break;
            case 'mythic':
                // 4 - 9
                attackUpgrade = Math.floor(Math.random() * 10) + 6;
                // 5 - 10
                hpUpgrade = Math.floor(Math.random() * 11) + 8;
                break;
        }

        if (newUpgradeLevel > currentUpgradeLevel) {
            return {
                attackUpgrade: attackUpgrade,
                hpUpgrade: hpUpgrade,
            };
        } else {
            return {
                attackUpgrade: 0,
                hpUpgrade: 0,
            };
        }
    } catch (err) {
        console.log({
            errorFrom: 'checkXPAndUpgrade',
            errorMessage: err,
        });
    }
};

/**
 * XP earned as total XP increases will be decreased.
 */
const xpToGive = (currentXp, damageDealt) => {
    let xpToGive;
    if (currentXp <= 200) {
        xpToGive = damageDealt;
    } else if (currentXp > 200 && currentXp <= 750) {
        xpToGive = Math.floor(damageDealt * 0.6);
    } else if (currentXp > 750 && currentXp <= 1500) {
        xpToGive = Math.floor(damageDealt * 0.375);
    } else if (currentXp > 1500 && currentXp <= 3500) {
        xpToGive = Math.floor(damageDealt * 0.2);
    } else if (currentXp > 3500 && currentXp <= 7500) {
        xpToGive = Math.floor(damageDealt * 0.125);
    } else if (currentXp > 7500 && currentXp <= 15000) {
        xpToGive = Math.floor(damageDealt * 0.08);
    } else if (currentXp > 15000 && currentXp <= 30000) {
        xpToGive = Math.floor(damageDealt * 0.065);
    } else {
        xpToGive = Math.floor(damageDealt * 0.035);
    }

    return xpToGive;
};

module.exports = {
    checkXPAndUpgrade,
    xpToGive,
};


