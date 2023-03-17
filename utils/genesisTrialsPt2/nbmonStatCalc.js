/**
 * NBMon gets its attack stat upgraded every 50 XP.
 * Attack stat gets upgraded by 1 - 4 (random).
 * If current XP + xpToGive / 50 is a whole number newer than the current upgrade level, upgrade the attack stat.
 * e.g. current upgrade level is 1. current XP is 50. xpToGive is 50. 50 + 50 / 50 = 2. 2 is newer than 1. upgrade the attack stat.
 */
const checkXPAndUpgrade = (currentXp, xpToGive) => {
    try {
        const upgradeChance = Math.floor(Math.random() * 4) + 1;
        const currentUpgradeLevel = Math.floor(currentXp / 50);
        const newUpgradeLevel = Math.floor((currentXp + xpToGive) / 50);

        // return either 1 - 4 if its to upgrade, or 0 if its not to upgrade.
        if (newUpgradeLevel > currentUpgradeLevel) {
            return upgradeChance * (newUpgradeLevel - currentUpgradeLevel);
        } else {
            return 0;
        }
    } catch (err) {
        console.log({
            errorFrom: 'checkXPAndUpgrade',
            errorMessage: err,
        });
    }
};

module.exports = {
    checkXPAndUpgrade,
};


