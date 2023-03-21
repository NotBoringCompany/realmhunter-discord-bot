const mongoose = require('mongoose');
const { TrialsShopSchema, DiscordUserSchema, NBMonSchema } = require('../schemas');
const { addPurchasedNBMon } = require('./nbmonAppearance');
const { checkXPAndUpgrade } = require('./nbmonStatCalc');

/**
 * Purchases a simple healing potion and restores the NBMon's HP to FULL.
 */
const purchaseSHP = async (userId, nbmonId) => {
    try {
        if (isNaN(nbmonId)) {
            return {
                status: 'error',
                message: 'Invalid NBMon ID.',
            };
        }

        const TrialsShop = mongoose.model('TrialsShop', TrialsShopSchema, 'RHDiscordTrialsShop');
        const trialsShopQuery = await TrialsShop.findOne({ itemName: 'Simple Healing Potion' });

        if (!trialsShopQuery) {
            return {
                status: 'error',
                message: 'Error getting Simple Healing Potion from the Trials Shop. Please open a ticket for this.',
            };
        }

        // we check if there's still enough stock.
        if (trialsShopQuery.stock === 0) {
            return {
                status: 'error',
                message: 'Simple Healing Potion out of stock.',
            };
        }

        // check if nbmon exists first to not cause errors later on.
        const NBMon = mongoose.model('NBMonData', NBMonSchema, 'RHDiscordNBMonData');
        const nbmonQuery = await NBMon.findOne({ nbmonId: nbmonId });

        if (!nbmonQuery) {
            return {
                status: 'error',
                message: 'Error getting your NBMon. Please open a ticket for this.',
            };
        }

        // check if the nbmon is owned by the user.
        if (nbmonQuery.capturedBy !== userId) {
            return {
                status: 'error',
                message: 'You do not own this NBMon.',
            };
        }

        // we check if the user has enough tags.
        const User = mongoose.model('UserData', DiscordUserSchema, 'RHDiscordUserData');
        const userQuery = await User.findOne({ userId: userId });

        if (!userQuery || userQuery.hunterTags < trialsShopQuery.tagCost) {
            return {
                status: 'error',
                message: 'You do not have enough cookies to purchase this item.',
            };
        }

        // once everything checks out, we:
        // 1. deduct the user's tags.
        // 2. deduct the item's stock.
        // 3. update the NBMon's max HP to full.

        // 1. deduct the user's tags.
        userQuery.hunterTags -= trialsShopQuery.tagCost;
        userQuery._updated_at = Date.now();
        await userQuery.save();

        // 2. deduct the item's stock.
        trialsShopQuery.stock -= 1;
        trialsShopQuery._updated_at = Date.now();
        await trialsShopQuery.save();

        // 3. update the NBMon's max HP to full.
        nbmonQuery.currentHp = nbmonQuery.maxHp;
        nbmonQuery._updated_at = Date.now();

        await nbmonQuery.save();

        return {
            status: 'success',
            message: `Successfully purchased Simple Healing Potion for ${trialsShopQuery.tagCost} cookies. Your NBMon's HP has been restored fully.`,
        };
    } catch (err) {
        console.log({
            errorFrom: 'purchaseSHP',
            errorMessage: err,
        });
    }
};

/**
 * Purchases an XP Booster and increases the NBMon's XP by 30.
 */
const purchaseXPBooster = async (userId, nbmonId) => {
    try {
        if (isNaN(nbmonId)) {
            return {
                status: 'error',
                message: 'Invalid NBMon ID.',
            };
        }
        const TrialsShop = mongoose.model('TrialsShop', TrialsShopSchema, 'RHDiscordTrialsShop');
        const trialsShopQuery = await TrialsShop.findOne({ itemName: 'XP Booster' });

        if (!trialsShopQuery) {
            return {
                status: 'error',
                message: 'Error getting XP Booster from the Trials Shop. Please open a ticket for this.',
            };
        }

        // we check if there's still enough stock.
        if (trialsShopQuery.stock === 0) {
            return {
                status: 'error',
                message: 'XP Booster out of stock.',
            };
        }

        // we check if the user has enough tags.
        const User = mongoose.model('UserData', DiscordUserSchema, 'RHDiscordUserData');
        const userQuery = await User.findOne({ userId: userId });

        if (!userQuery || userQuery.hunterTags < trialsShopQuery.tagCost) {
            return {
                status: 'error',
                message: 'You do not have enough cookies to purchase this item.',
            };
        }

        // once everything checks out, we:
        // 1. deduct the user's tags.
        // 2. deduct the item's stock.
        // 3. update the NBMon's XP by 30.

        // check if nbmon exists first to not cause errors later on.
        const NBMon = mongoose.model('NBMonData', NBMonSchema, 'RHDiscordNBMonData');
        const nbmonQuery = await NBMon.findOne({ nbmonId: nbmonId });

        if (!nbmonQuery) {
            return {
                status: 'error',
                message: 'Error getting your NBMon. Please open a ticket for this.',
            };
        }

        // check if the nbmon is owned by the user.
        if (nbmonQuery.capturedBy !== userId) {
            return {
                status: 'error',
                message: 'You do not own this NBMon.',
            };
        }

        // 1. deduct the user's tags.
        userQuery.hunterTags -= trialsShopQuery.tagCost;
        userQuery._updated_at = Date.now();
        await userQuery.save();

        // 2. deduct the item's stock.
        trialsShopQuery.stock -= 1;
        trialsShopQuery._updated_at = Date.now();
        await trialsShopQuery.save();

        // 3. update the NBMon's XP by 30.
        // we check if the nbmon has levelled up by giving the 30 xp. if yes, upgrade the atk and hp stat.
        const { attackUpgrade, hpUpgrade } = checkXPAndUpgrade(nbmonQuery.rarity, nbmonQuery.xp, 30);

        nbmonQuery.xp += 30;
        nbmonQuery._updated_at = Date.now();

        await nbmonQuery.save();

        await NBMon.updateOne({ nbmonId: nbmonId }, { $set: { atk: nbmonQuery.atk + attackUpgrade, maxHp: nbmonQuery.maxHp + hpUpgrade } });

        return {
            status: 'success',
            message: `Successfully purchased XP Booster for ${trialsShopQuery.tagCost} cookies. Your NBMon's XP has been increased by 30.`,
        };
    } catch (err) {
        console.log({
            errorFrom: 'purchaseXPBooster',
            errorMessage: err,
        });
    }
};

/**
 * Purchases a common NBMon.
 */
const purchaseCommonNBMon = async (userId) => {
    try {
        const TrialsShop = mongoose.model('TrialsShop', TrialsShopSchema, 'RHDiscordTrialsShop');
        const trialsShopQuery = await TrialsShop.findOne({ itemName: 'Common NBMon' });

        if (!trialsShopQuery) {
            return {
                status: 'error',
                message: 'Error getting Common NBMon from the Trials Shop. Please open a ticket for this.',
            };
        }

        // we check if there's still enough stock.
        if (trialsShopQuery.stock === 0) {
            return {
                status: 'error',
                message: 'Common NBMon out of stock.',
            };
        }

        // we then check if the user already has 5 nbmons.
        const NBMon = mongoose.model('NBMonData', NBMonSchema, 'RHDiscordNBMonData');
        const nbmonUserQuery = await NBMon.find({ capturedBy: userId });
        if (nbmonUserQuery.length >= 5) {
            return {
                status: 'error',
                message: `You already have 5 NBMons. You cannot have more.`,
            };
        }

        // we check if the user has enough tags.
        const User = mongoose.model('UserData', DiscordUserSchema, 'RHDiscordUserData');
        const userQuery = await User.findOne({ userId: userId });

        if (!userQuery || userQuery.hunterTags < trialsShopQuery.tagCost) {
            return {
                status: 'error',
                message: 'You do not have enough cookies to purchase this item.',
            };
        }

        // once everything checks out, we:
        // 1. deduct the user's tags.
        // 2. deduct the item's stock.
        // 3. call `addPurchasedNBMon`.

        // 1. deduct the user's tags.
        userQuery.hunterTags -= trialsShopQuery.tagCost;
        userQuery._updated_at = Date.now();
        await userQuery.save();

        // 2. deduct the item's stock.
        trialsShopQuery.stock -= 1;
        trialsShopQuery._updated_at = Date.now();
        await trialsShopQuery.save();

        // 3. call `addPurchasedNBMon`.
        const { status } = await addPurchasedNBMon('Common', userId);
        if (status === 'error') {
            return {
                status: 'error',
                message: 'Error purchasing NBMon. Please open a ticket for this.',
            };
        }

        return {
            status: 'success',
            message: `Successfully purchased a randomized Common NBMon for ${trialsShopQuery.tagCost} cookies. It should be available in your inventory now.`,
        };
    } catch (err) {
        console.log({
            errorFrom: 'purchaseCommonNBMon',
            errorMessage: err,
        });
    }
};

const trialsShopButtons = () => {
    return [
        {
            type: 2,
            style: 1,
            label: 'Simple Healing Potion',
            custom_id: 'purchaseSHPButton',
        },
        {
            type: 2,
            style: 1,
            label: 'XP Booster',
            custom_id: 'purchaseXPBoosterButton',
        },
        {
            type: 2,
            style: 1,
            label: 'Common NBMon',
            custom_id: 'purchaseCommonNBMonButton',
        },
    ];
};

module.exports = {
    purchaseSHP,
    purchaseXPBooster,
    purchaseCommonNBMon,
    trialsShopButtons,
};
