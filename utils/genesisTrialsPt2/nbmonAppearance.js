require('dotenv').config();
const mongoose = require('mongoose');
const { nbmonAppearanceEmbed } = require('../../embeds/genesisTrialsPt2/nbmonAppearance');
const { generateObjectId } = require('../cryptoUtils');
const permissions = require('../dbPermissions');
const { NBMonSchema } = require('../schemas');
const { stats, genusData } = require('./nbmonStatRandomizer');
const cron = require('node-cron');

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
 * Randomizes from a list of available NBMons and allows it to appear in general chat (given that the check passes).
 */
const nbmonAppears = async (client) => {
    try {
        const { message, canAppear } = await allowNextNBMonAppearance();

        if (!canAppear) {
            return {
                status: 'error',
                message: message,
            };
        }

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

        return {
            status: 'success',
            message: 'NBMon appeared.',
        };
    } catch (err) {
        console.log({
            errorFrom: 'nbmonAppears',
            errorMessage: err,
        });
    }
};

/**
 * Checks if `nbmonId` has already been captured.
 * If `nbmonId` isn't provided, it will check the previous NBMon that appeared.
 * Providing an ID helps to check if a user can capture THAT particular NBMon, while not providing an ID helps check if a new NBMon can appear.
 */
const nbmonCaptured = async (nbmonId) => {
    try {
        const NBMon = mongoose.model('NBMonData', NBMonSchema, 'RHDiscordNBMonData');
        let nbmonQuery;

        if (nbmonId) {
            // nbmon id query
            nbmonQuery = await NBMon.findOne({ nbmonId: nbmonId });
        } else {
            nbmonQuery = await NBMon.findOne({}).sort({ nbmonId: -1 });
        }

        // if nbmon doesnt exist, then we just return 'captured'.
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
 * Checks if the user has enough cookies to capture an NBMon. Requires 90 cookies.
 */
const enoughCookiesToCapture = async (userId) => {
    try {
        const User = mongoose.model('UserData', UserSchema, 'RHDiscordUserData');
        const userQuery = await User.findOne({ userId: userId });

        if (!userQuery) {
            return {
                status: 'error',
                message: 'Not enough cookies to capture the NBMon.',
            };
        }

        if (userQuery.hunterTags <)
    } catch (err) {
        console.log({
            errorFrom: 'enoughCookiesToCapture',
            errorMessage: err,
        });
    }
};

/**
 * Gets the timestamp of the previous NBMon that appeared.
 */
const prevNBMonAppearance = async () => {
    try {
        const NBMon = mongoose.model('NBMonData', NBMonSchema, 'RHDiscordNBMonData');
        const nbmonQuery = await NBMon.findOne({}).sort({ nbmonId: -1 });

        if (!nbmonQuery) {
            return 0;
        } else {
            return nbmonQuery.appearanceTimestamp;
        }
    } catch (err) {
        console.log({
            errorFrom: 'prevNBMonAppearance',
            errorMessage: err,
        });
    }
};

/**
 * Checks if the next NBMon can appear.
 * In order for the next NBMon to appear:
 * // 1. the time passed between now and the previous NBMon's appearance must be greater than 10 minutes.
 * // 2. the previous NBMon must have been captured.
 */
const allowNextNBMonAppearance = async () => {
    try {
         const prevNBMonCaptured = await nbmonCaptured();
         const prevAppearance = await prevNBMonAppearance();
         const now = Math.floor(new Date().getTime() / 1000);

         const timeDiff = now - prevAppearance;

         if (!prevNBMonCaptured) {
            return {
                status: 'error',
                message: 'A new NBMon wants to appear but the previous NBMon was not captured yet. Scroll up in this chat to find the NBMon\'s ID and capture it first to allow the new one to appear later!',
                canAppear: false,
            };
         }

         if (prevNBMonCaptured && timeDiff < 600) {
            return {
                status: 'error',
                message: 'Next NBMon can\'t appear yet.',
                canAppear: false,
            };
         }

         if (prevNBMonCaptured && timeDiff >= 600) {
            return {
                status: 'success',
                message: 'Next NBMon can appear.',
                canAppear: true,
            };
         }
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
const captureNBMonLogic = async (nbmonId, userId) => {
    try {
        // we check if the nbmon has already been captured.
        const captured = await nbmonCaptured(nbmonId);

        if (captured) {
            return {
                status: 'error',
                message: 'NBMon doesn\'t exist or is already captured by someone else.',
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

        return {
            status: 'success',
            message: `<@${userId}> has captured NBMon #${nbmonId}! The NBMon is now available in their inventory.`,
        };
    } catch (err) {
        console.log({
            errorFrom: 'captureNBMon',
            errorMessage: err,
        });
    }
};

/**
 * Rolls a random number between 1 to 100 every minute.
 * If the number rolled is a 1, then an NBMon will appear, given that it passes the checks already.
 */
const nbmonAppearanceScheduler = async (client) => {
    try {
        // gets run every 1 minute.
        cron.schedule('* * * * *', async () => {
            const rand = Math.floor(Math.random() * 100) + 1;

            console.log(rand);

            const now = Math.floor(new Date().getTime() / 1000);
            const prevAppearance = await prevNBMonAppearance();

            // if rand is either 1 or the time passed between now and the previous NBMon is over an hour, we will show the nbmon.
            if (rand === 1 || now - prevAppearance >= 3600) {
                const { status, message } = await nbmonAppears(client);
                if (status === 'error') {
                    // we don't need to show this message in the general chat.
                    if (message !== 'Next NBMon can\'t appear yet.') {
                        await client.channels.cache.get(process.env.TEST_GENERAL_CHAT_CHANNELID).send(message);
                    } else {
                        console.log(message);
                    }
                }
            }
        });
    } catch (err) {
        console.log({
            errorFrom: 'nbmonAppearanceScheduler',
            errorMessage: err,
        });
    }
};

module.exports = {
    addNBMon,
    getLatestWildNBMonId,
    nbmonAppears,
    nbmonCaptured,
    captureNBMonLogic,
    allowNextNBMonAppearance,
    nbmonAppearanceScheduler,
};
