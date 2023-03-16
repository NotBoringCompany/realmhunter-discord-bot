require('dotenv').config();
const mongoose = require('mongoose');
const { nbmonAppearanceEmbed } = require('../../embeds/genesisTrialsPt2/nbmonAppearance');
const { generateObjectId } = require('../cryptoUtils');
const permissions = require('../dbPermissions');
const { NBMonSchema, DiscordUserSchema } = require('../schemas');
const { stats, genusData } = require('./nbmonStatRandomizer');

mongoose.connect(process.env.MONGODB_URI);
/**
 * Adds an NBMon to the database once it appears.
 */
const addNBMon = async (nbmonId, genus, stats) => {
    try {
        const NBMon = mongoose.model('NBMonData', NBMonSchema, 'RHDiscordNBMonData');

        // get the NBMon data from the database to check the latest ID.

        const { _wperm, _rperm, _acl } = permissions(false, false);
        const NewNBMon = new NBMon(
            {
                _id: generateObjectId(),
                _created_at: Date.now(),
                _updated_at: Date.now(),
                _wperm: _wperm,
                _rperm: _rperm,
                _acl: _acl,
                nbmonId: nbmonId,
                genus: genus,
                appearanceTimestamp: Math.floor(new Date().getTime() / 1000),
                stats: stats,
            },
        );

        await NewNBMon.save();

        return {
            status: 'success',
            message: 'NBMon added to database.',
        };
    } catch (err) {
        console.log({
            errorFrom: 'addNBMon',
            errorMessage: err,
        });
    }
};

/**
 * Gets the ID of the latest NBMon that appeared.
 */
const getLatestWildNBMonId = async () => {
    try {
        const NBMon = mongoose.model('NBMonData', NBMonSchema, 'RHDiscordNBMonData');
        const latestWildNBMon = await NBMon.findOne({}).sort({ nbmonId: -1 });

        if (!latestWildNBMon) {
            return 0;
        }

        return latestWildNBMon.nbmonId;
    } catch (err) {
        console.log({
            errorFrom: 'getLatestWildNBMonId',
            errorMessage: err,
        });
    }
};

/**
 * Randomizes from a list of available NBMons and allows it to appear in general chat.
 */
const nbmonAppears = async (client) => {
    try {
        const getGenus = genusData();
        const getStats = stats();

        if (!getStats.rarity) {
            return;
        }

        const latestWildNBMonId = await getLatestWildNBMonId();

        const newId = latestWildNBMonId + 1;

        // adds the wild NBMon to the database and then sends the message to general chat.
        await addNBMon(newId, getGenus.name, getStats);
        // right now, it will be in test general chat. it will be changed later.
        await client.channels.cache.get(process.env.TEST_GENERAL_CHAT_CHANNELID).send({ embeds: [nbmonAppearanceEmbed(getStats.rarity, newId, getGenus.name, getGenus.image)] });
    } catch (err) {
        console.log({
            errorFrom: 'nbmonAppears',
            errorMessage: err,
        });
    }
};

/**
 * Checks if `nbmonId` has already been captured.
 */
const nbmonCaptured = async () => {
    try {
        const NBMon = mongoose.model('NBMonData', NBMonSchema, 'RHDiscordNBMonData');
        // nbmon id query in descending order.
        const nbmonQuery = await NBMon.findOne().sort({ nbmonId: -1 });

        // if nbmon doesnt exist, then the 'null' nbmon is considered captured.
        if (!nbmonQuery) {
            return true;
        } else {
            return nbmonQuery.capturedTimestamp ? true : false;
        }
    } catch (err) {
        console.log({
            errorFrom: 'nbmonCaptured',
            errorMessage: err,
        });
    }
};

/**
 * Checks if the next NBMon can appear.
 * In order for the next NBMon to appear:
 * // 1. the time passed between now and the previous NBMon's capture must be greater than 5 minutes.
 * // 2. the previous NBMon must have been captured.
 */
const allowNextNBMonAppearance = async () => {
    try {
         
    } catch (err) {
        console.log({
            errorFrom: 'allowNextNBMonAppearance',
            errorMessage: err,
        });
    }
};

/**
 * Captures an NBMon that appeared.
 */
const captureNBMon = async (nbmonId, userId) => {
    try {
        // we check if the nbmon has already been captured.
        const captured = await nbmonCaptured(nbmonId);

        if (captured) {
            return {
                status: 'error',
                message: 'Error. NBMon already captured.',
            };
        }


        const NBMon = mongoose.model('NBMonData', NBMonSchema, 'RHDiscordNBMonData');
        const nbmonQuery = await NBMon.findOne({ nbmonId: nbmonId });

        // if nbmon doesnt exist, we return an error.
        if (!nbmonQuery) {
            return {
                status: 'error',
                message: 'Error. NBMon not found.',
            };
        }

        // if the nbmon has not been captured, we update the database.
        // we update the `capturedTimestamp` and the `capturedBy` fields.
        nbmonQuery.capturedBy = userId;
        nbmonQuery.capturedTimestamp = Math.floor(new Date().getTime() / 1000);

        await nbmonQuery.save();
    } catch (err) {
        console.log({
            errorFrom: 'captureNBMon',
            errorMessage: err,
        });
    }
};

module.exports = {
    addNBMon,
    getLatestWildNBMonId,
    nbmonAppears,
    nbmonCaptured,
    captureNBMon,
};
