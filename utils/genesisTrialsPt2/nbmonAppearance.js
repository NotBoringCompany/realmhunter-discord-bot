require('dotenv').config();
const mongoose = require('mongoose');
const { nbmonAppearanceEmbed } = require('../../embeds/genesisTrialsPt2/nbmonAppearance');
const { generateObjectId } = require('../cryptoUtils');
const permissions = require('../dbPermissions');
const { NBMonSchema, DiscordUserSchema } = require('../schemas');
const { genusData, rarity } = require('./nbmonStatRandomizer');
const cron = require('node-cron');

/**
 * Adds an NBMon to the database once it appears.
 */
const addNBMon = async (nbmonId, genus) => {
    try {
        const NBMon = mongoose.model('NBMonData', NBMonSchema, 'RHDiscordNBMonData');

        const { _wperm, _rperm, _acl } = permissions(false, false);

        const getRarity = rarity();
        const NewNBMon = new NBMon(
            {
                _id: generateObjectId(),
                _created_at: Date.now(),
                _updated_at: Date.now(),
                _wperm: _wperm,
                _rperm: _rperm,
                _acl: _acl,
                bought: false,
                disowned: false,
                nbmonId: nbmonId,
                genus: genus,
                xp: 0,
                maxHp: 30,
                currentHp: 30,
                atk: 5,
                rarity: getRarity,
                appearanceTimestamp: Math.floor(new Date().getTime() / 1000),
            },
        );

        await NewNBMon.save();
        return {
            status: 'success',
            message: 'NBMon added to database.',
            rarity: getRarity,
        };
    } catch (err) {
        console.log({
            errorFrom: 'addNBMon',
            errorMessage: err,
        });
    }
};

/**
 * Adds a purchased NBMon and assigns it directly to the user.
 */
const addPurchasedNBMon = async (rarity, userId) => {
    try {
        const NBMon = mongoose.model('NBMonData', NBMonSchema, 'RHDiscordNBMonData');
        const { _wperm, _rperm, _acl } = permissions(false, false);

        // generate random ID from 1000000 to 10000000000 and check if it exists in the database.
        // if it does, generate a new ID and check again.
        // if it doesn't, add the NBMon to the database.
        let id;
        let idExists = true;
        while (idExists) {
            // from 10000000 to 10000000000
            const randomId = Math.floor(Math.random() * 10000000000) + 10000000;
            const nbmonQuery = await NBMon.findOne({ nbmonId: randomId });

            if (!nbmonQuery) {
                id = randomId;
                idExists = false;
            }
        }

        const NewNBMon = new NBMon(
            {
                _id: generateObjectId(),
                _created_at: Date.now(),
                _updated_at: Date.now(),
                _wperm: _wperm,
                _rperm: _rperm,
                _acl: _acl,
                bought: true,
                disowned: false,
                nbmonId: id,
                genus: genusData().name,
                xp: 0,
                maxHp: 30,
                currentHp: 30,
                atk: 5,
                rarity: rarity,
                appearanceTimestamp: Math.floor(new Date().getTime() / 1000),
                capturedTimestamp: Math.floor(new Date().getTime() / 1000),
                capturedBy: userId,
            },
        );

        await NewNBMon.save();

        return {
            status: 'success',
            message: 'Purchased NBMon added to database.',
        };
    } catch (err) {
        console.log({
            errorFrom: 'addPurchasedNBMon',
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

        // get a random number between 10000000 to 10000000000.
        let newId;
        let idExists = true;
        // check the NBMon ID if it already exists in the database.
        const NBMon = mongoose.model('NBMonData', NBMonSchema, 'RHDiscordNBMonData');
        while (idExists) {
            // from 10000000 to 10000000000
            const randomId = Math.floor(Math.random() * 10000000000) + 10000000;
            const nbmonQuery = await NBMon.findOne({ nbmonId: randomId });

            if (!nbmonQuery) {
                newId = randomId;
                idExists = false;
            }
        }

        // after 20 march 12:00 GMT, the cost to capture will be 2x the requirement.
        const costToCapture = (parseInt(process.env.CAPTURE_NBMON_TAG_REQUIREMENT) * 2).toString();

        // adds the wild NBMon to the database and then sends the message to general chat.
        const { rarity } = await addNBMon(newId, getGenus.name);
        // right now, it will be in test general chat. it will be changed later.
        await client.channels.cache.get(process.env.GENERAL_CHAT_CHANNELID).send({ embeds: [nbmonAppearanceEmbed(costToCapture, rarity, newId, getGenus.name, getGenus.imageUrl)] });

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
            nbmonQuery = await NBMon.findOne({ bought: false }).sort({ _created_at: -1 });
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
 * Gets the timestamp of the most recent NBMon (not bought) that appeared.
 */
const prevNBMonAppearance = async () => {
    try {
        const NBMon = mongoose.model('NBMonData', NBMonSchema, 'RHDiscordNBMonData');
        const nbmonQuery = await NBMon.findOne({ bought: false }).sort({ _created_at: -1 });

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
 * // 1. the time passed between now and the previous non bought NBMon's appearance must be greater than 3 minutes.
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

        if (prevNBMonCaptured && timeDiff < 180) {
            return {
                status: 'error',
                message: 'Next NBMon can\'t appear yet.',
                canAppear: false,
            };
        }

        if (prevNBMonCaptured && timeDiff >= 180) {
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
        // we now check if the user has enough tags to capture the NBMon.
        // requires 40 TAGS! (may change).
        const User = mongoose.model('UserData', DiscordUserSchema, 'RHDiscordUserData');
        const userQuery = await User.findOne({ userId: userId });

        // if its already above 20 March 20:00 GMT, the price to capture is doubled.
        if (!userQuery || userQuery.hunterTags < parseInt(process.env.CAPTURE_NBMON_TAG_REQUIREMENT) * 2) {
            return {
                status: 'error',
                message: 'Not enough cookies to capture the NBMon.',
            };
        }

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

        // we will now check if the user has captured more than 5 nbmons already.
        // if they have, we will not allow them to capture more.
        const nbmonUserQuery = await NBMon.find({ capturedBy: userId, disowned: false });
        if (nbmonUserQuery.length >= 5) {
            return {
                status: 'error',
                message: `<@${userId}>, you have already captured 5 NBMons. You're not allowed to capture more.`,
            };
        }

        // if the nbmon has not been captured, we update the database.
        // we update the `capturedTimestamp` and the `capturedBy` fields.
        nbmonQuery.capturedBy = userId;
        nbmonQuery.capturedTimestamp = Math.floor(new Date().getTime() / 1000);
        nbmonQuery._updated_at = Date.now();

        await nbmonQuery.save();

        // if time is already after 20 march 20:00 GMT, price is doubled.
        userQuery.hunterTags -= parseInt(process.env.CAPTURE_NBMON_TAG_REQUIREMENT) * 2;
        userQuery._updated_at = Date.now();

        await userQuery.save();

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
 * Rolls a random number between 1 to 100 every 3 minutes.
 * 15% chance an nbmon appears, then an NBMon will appear, given that it passes the checks already.
 */
// const nbmonAppearanceScheduler = async (client) => {
//     try {
//         // gets run every 3 minutes.
//         cron.schedule('*/3 * * * *', async () => {
//             const rand = Math.floor(Math.random() * 100) + 1;

//             console.log('nbmon appearance rand: ', rand);

//             const now = Math.floor(new Date().getTime() / 1000);
//             const prevAppearance = await prevNBMonAppearance();

//             const isOver15Minutes = now - prevAppearance >= 900;

//             // if rand is either 1-5 or the time passed between now and the previous NBMon is over an hour, we will show the nbmon.
//             if (rand <= 15 || isOver15Minutes) {
//                 const { status, message } = await nbmonAppears(client);
//                 if (status === 'error') {
//                     // we don't need to show this message in the general chat.
//                     if (message !== 'Next NBMon can\'t appear yet.') {
//                         await client.channels.cache.get(process.env.GENERAL_CHAT_CHANNELID).send(message);
//                     } else {
//                         console.log(message);
//                     }
//                 }
//             }
//         });
//     } catch (err) {
//         console.log({
//             errorFrom: 'nbmonAppearanceScheduler',
//             errorMessage: err,
//         });
//     }
// };

module.exports = {
    addNBMon,
    addPurchasedNBMon,
    nbmonAppears,
    nbmonCaptured,
    captureNBMonLogic,
    allowNextNBMonAppearance,
    nbmonAppearanceScheduler,
};
