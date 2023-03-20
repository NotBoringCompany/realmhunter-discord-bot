const mongoose = require('mongoose');
const { NBMonSchema, DiscordUserSchema } = require('../schemas');

/**
 * Gets the NBMon data of `nbmonId` owned by `userId`.
 */
const getNBMonData = async (userId, nbmonId) => {
    try {
        const NBMon = mongoose.model('NBMonData', NBMonSchema, 'RHDiscordNBMonData');
        const nbmonQuery = await NBMon.findOne({ nbmonId: nbmonId });

        if (!nbmonQuery) {
            return {
                status: 'error',
                message: 'Error getting your NBMon. Please open a ticket for this.',
                data: undefined,
            };
        }

        if (nbmonQuery.capturedBy !== userId) {
            return {
                status: 'error',
                message: 'You do not own this NBMon.',
                data: undefined,
            };
        }

        const data = {
            nbmonId: nbmonQuery.nbmonId,
            genus: nbmonQuery.genus,
            xp: nbmonQuery.xp,
            maxHp: nbmonQuery.maxHp,
            currentHp: nbmonQuery.currentHp,
            atk: nbmonQuery.atk,
            rarity: nbmonQuery.rarity,
            customName: nbmonQuery.customName,
        };

        return {
            status: 'success',
            message: 'Successfully retrieved NBMon data.',
            data: data,
        };
    } catch (err) {
        console.log({
            errorFrom: 'getNBMonData',
            errorMessage: err,
        });
    }
};

/**
 * Gets all owned NBMon IDs owned by `userId`.
 */
const getNBMonIdsOwned = async (userId) => {
    try {
        const NBMon = mongoose.model('NBMonData', NBMonSchema, 'RHDiscordNBMonData');
        const nbmonQuery = await NBMon.find({ capturedBy: userId, disowned: false });

        if (!nbmonQuery || nbmonQuery.length === 0) {
            return {
                status: 'error',
                message: `You do not own any NBMons.`,
            };
        }

        const nbmonIds = nbmonQuery.map((nbmon) => nbmon.nbmonId);

        return {
            status: 'success',
            message: `You own the following NBMons: ${nbmonIds.join(', ')}`,
        };
    } catch (err) {
        console.log({
            errorFrom: 'getNBMonIdsOwned',
            errorMessage: err,
        });
    }
};

/**
 * Changes the name of the NBMon. Only the owner of the NBMon can change its name.
 * Costs 20 tags IF name already exists. Free otherwise.
 */
const changeNBMonName = async (userId, nbmonId, customName) => {
    try {
        const NBMon = mongoose.model('NBMonData', NBMonSchema, 'RHDiscordNBMonData');
        const nbmonQuery = await NBMon.findOne({ nbmonId: nbmonId });

        if (!nbmonQuery) {
            return {
                status: 'error',
                message: 'NBMon not found.',
            };
        }

        if (nbmonQuery.capturedBy !== userId) {
            return {
                status: 'error',
                message: 'You do not own this NBMon.',
            };
        }

        // check if the name already exists.
        const customNameExists = nbmonQuery.customName;

        // if it exists, we:
        // 1. check if the user has 20 tags to pay.
        // 2. if yes, deduct 20 tags from the user. if no, return an error.
        // 3. change the name of the NBMon.
        if (customNameExists) {
            const User = mongoose.model('UserData', DiscordUserSchema, 'RHDiscordUserData');
            const userQuery = await User.findOne({ userId: userId });

            if (!userQuery || userQuery.hunterTags < parseInt(process.env.CHANGE_NBMON_NAME_TAG_REQUIREMENT)) {
                return {
                    status: 'error',
                    message: 'You do not have enough cookies to change the name of this NBMon.',
                };
            }

            // deduct 20 tags from the user.
            userQuery.hunterTags -= parseInt(process.env.CHANGE_NBMON_NAME_TAG_REQUIREMENT);
            userQuery._updated_at = Date.now();

            // change the name of the NBMon.
            nbmonQuery.customName = customName;
            nbmonQuery._updated_at = Date.now();

            await userQuery.save();
            await nbmonQuery.save();

            return {
                status: 'success',
                message: `Spent ${process.env.CHANGE_NBMON_NAME_TAG_REQUIREMENT} cookies to change the name of NBMon #${nbmonId} to **${customName}**.`,
            };
        // if the name does not exist, we will just change the name of the NBMon.
        } else {
            nbmonQuery.customName = customName;
            nbmonQuery._updated_at = Date.now();

            await nbmonQuery.save();

            return {
                status: 'success',
                message: `Changed the name of NBMon #${nbmonId} to **${customName}**.`,
            };
        }
    } catch (err) {
        console.log({
            errorFrom: 'changeNBMonName',
            errorMessage: err,
        });
    }
};

/**
 * Disowns the NBMon that `userId` owns. Costs 20 tags.
 */
const disownNBMon = async (userId, nbmonId) => {
    try {
        const NBMon = mongoose.model('NBMonData', NBMonSchema, 'RHDiscordNBMonData');
        const nbmonQuery = await NBMon.findOne({ nbmonId: nbmonId });

        if (!nbmonQuery || nbmonQuery.capturedBy !== userId) {
            return {
                status: 'error',
                message: 'NBMon not found or you do not own this NBMon.',
            };
        }

        // we check if it's already disowned.
        if (nbmonQuery.disowned) {
            return {
                status: 'error',
                message: 'This NBMon is already disowned.',
            };
        }

        // we check if the user has 20 tags.
        const User = mongoose.model('UserData', DiscordUserSchema, 'RHDiscordUserData');
        const userQuery = await User.findOne({ userId: userId });

        if (!userQuery || userQuery.hunterTags < parseInt(process.env.DISOWN_NBMON_TAG_REQUIREMENT)) {
            return {
                status: 'error',
                message: 'You do not have enough cookies to disown this NBMon.',
            };
        }

        // else, we:
        // 1. deduct 20 tags from the user.
        // 2. disown the NBMon.
        userQuery.hunterTags -= parseInt(process.env.DISOWN_NBMON_TAG_REQUIREMENT);
        userQuery._updated_at = Date.now();

        nbmonQuery.disowned = true;

        await userQuery.save();
        await nbmonQuery.save();

        return {
            status: 'success',
            message: `Successfully spent ${process.env.DISOWN_NBMON_TAG_REQUIREMENT} cookies to disown NBMon #${nbmonId}.`,
        };
    } catch (err) {
        console.log({
            errorFrom: 'disownNBMon',
            errorMessage: err,
        });
    }
};

const ownedNBMonEmbedButtons = () => {
    return [
        {
            type: 2,
            style: 1,
            label: 'Check NBMon stats',
            custom_id: 'checkNBMonStatsButton',
        },
        {
            type: 2,
            style: 1,
            label: 'Check owned NBMon IDs',
            custom_id: 'checkOwnedNBMonIdsButton',
        },
        {
            type: 2,
            style: 1,
            label: 'Change NBMon name',
            custom_id: 'changeNBMonNameButton',
        },
        {
            type: 2,
            style: 1,
            label: 'Disown NBMon',
            custom_id: 'disownNBMonButton',
        },
    ];
};

module.exports = {
    getNBMonData,
    getNBMonIdsOwned,
    ownedNBMonEmbedButtons,
    changeNBMonName,
    disownNBMon,
};
