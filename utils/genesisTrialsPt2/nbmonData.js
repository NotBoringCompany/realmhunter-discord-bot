const mongoose = require('mongoose');
const { NBMonSchema } = require('../schemas');

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
        const nbmonQuery = await NBMon.find({ capturedBy: userId });

        if (!nbmonQuery) {
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
    ];
};

module.exports = {
    getNBMonData,
    getNBMonIdsOwned,
    ownedNBMonEmbedButtons,
};
