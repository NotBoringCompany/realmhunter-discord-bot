const mongoose = require('mongoose');
const { NBMonSchema, DiscordUserSchema } = require('../schemas');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI);

// trades an NBMon for realm points.
const tradeNBMon = async (userId, nbmonId) => {
    try {
        const NBMon = mongoose.model('NBMonData', NBMonSchema, 'RHDiscordNBMonData');
        const nbmonQuery = await NBMon.findOne({ nbmonId: nbmonId });

        if (!nbmonQuery) {
            return {
                status: 'error',
                message: 'NBMon ID not found.',
            };
        }

        if (nbmonQuery.capturedBy !== userId) {
            return {
                status: 'error',
                message: 'You do not own this NBMon.',
            };
        }

        if (nbmonQuery.disowned) {
            return {
                status: 'error',
                message: 'This NBMon has already been disowned.',
            };
        }

        // once all checks have passed, we will check how many realm points the user can earn.
        const realmPoints = realmPointsEarned(nbmonQuery.xp, nbmonQuery.rarity, nbmonQuery.genus);

        const User = mongoose.model('UserData', DiscordUserSchema, 'RHDiscordUserData');
        const userQuery = await User.findOne({ userId: userId });

        if (!userQuery) {
            return {
                status: 'error',
                message: 'We cannot find your user data. Please contact support.',
            };
        }

        // update the nbmon's disowned status to true.
        nbmonQuery.disowned = true;
        nbmonQuery._updated_at = Date.now();

        await nbmonQuery.save();

        // update the user's realm points.
        if (!userQuery.realmPoints) {
            userQuery.realmPoints = realmPoints;
        } else {
            userQuery.realmPoints += realmPoints;
        }

        userQuery._updated_at = Date.now();

        await userQuery.save();

        return {
            status: 'success',
            message: `Successfully traded NBMon #${nbmonId} for ${realmPoints} Favor Points.`,
        };
    } catch (err) {
        console.log({
            errorFrom: 'tradeNBMon',
            errorMessage: err,
        });
    }
};

const tradeNBMonButtons = () => {
    return [
        {
            type: 2,
            style: 1,
            label: 'Trade NBMon',
            custom_id: 'tradeNBMonButton',
        },
    ];
};

// calculates how many realm points the user can get by trading the nbmon.
const realmPointsEarned = (xp, rarity, genus) => {
    const xpAdd = Math.floor(Math.pow(xp, 8/9));
    let rarityAdd;

    if (rarity.toLowerCase() === 'common') {
        rarityAdd = 0;
    } else if (rarity.toLowerCase() === 'uncommon') {
        rarityAdd = 100;
    } else if (rarity.toLowerCase() === 'rare') {
        rarityAdd = 250;
    } else if (rarity.toLowerCase() === 'epic') {
        rarityAdd = 450;
    } else if (rarity.toLowerCase() === 'legendary') {
        rarityAdd = 900;
    } else if (rarity.toLowerCase() === 'mythical') {
        rarityAdd = 2500;
    }

    let genusAdd;
    if (
        genus.toLowerCase() === 'pfufu' ||
        genus.toLowerCase() === 'roggo' ||
        genus.toLowerCase() === 'birvo' ||
        genus.toLowerCase() === 'pongu'
    ) {
        genusAdd = 400;
    } else if (
        genus.toLowerCase() === 'heree' ||
        genus.toLowerCase() === 'todillo' ||
        genus.toLowerCase() === 'schoggi'
    ) {
        genusAdd = 650;
    } else if (
        genus.toLowerCase() === 'milnas' ||
        genus.toLowerCase() === 'licorine' ||
        genus.toLowerCase() === 'dranexx' ||
        genus.toLowerCase() === 'lamox'
    ) {
        genusAdd = 1000;
    }

    console.log(xpAdd, rarityAdd, genusAdd);
    return xpAdd + rarityAdd + genusAdd;
};
module.exports = {
    tradeNBMon,
    tradeNBMonButtons,
};
