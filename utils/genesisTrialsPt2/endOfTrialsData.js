require('dotenv').config();

const mongoose = require('mongoose');
const { NBMonSchema, DiscordUserSchema } = require('../schemas');

mongoose.connect(process.env.MONGODB_URI);

const getNBMonXPData = async () => {
    try {
        const NBMon = mongoose.model('NBMonData', NBMonSchema, 'RHDiscordNBMonData');
        const nbmonQuery = await NBMon.find().sort({ xp: -1 });

        const highestXp = nbmonQuery[0].xp;
        const lowestXp = nbmonQuery[nbmonQuery.length - 1].xp;

        // get the average XP of all NBMons.
        const averageXp = nbmonQuery.reduce((acc, nbmon) => acc + nbmon.xp, 0) / nbmonQuery.length;

        console.log(highestXp, lowestXp, averageXp.toFixed(0));
    } catch (err) {
        console.log({
            errorFrom: 'getNBMonXPData',
            errorMessage: err,
        });
    }
};

const getNBMonGenusData = async () => {
    try {
        const NBMon = mongoose.model('NBMonData', NBMonSchema, 'RHDiscordNBMonData');
        const generaInfo = [];

        const nbmonQuery = await NBMon.find();

        // for each genera, get the amount of NBMons that have that genera.
        for (let i = 0; i < nbmonQuery.length; i++) {
            const nbmon = nbmonQuery[i];

            const generaIndex = generaInfo.findIndex((genus) => genus.genus === nbmon.genus);
            if (generaIndex === -1) {
                generaInfo.push({
                    genus: nbmon.genus,
                    count: 1,
                });
            } else {
                generaInfo[generaIndex].count++;
            }
        }

        // sort the generaInfo array by the amount of NBMons that have that genera.
        generaInfo.sort((a, b) => b.count - a.count);

        console.log(generaInfo);
    } catch (err) {
        console.log({
            errorFrom: 'getNBMonGenusData',
            errorMessage: err,
        });
    }
};

const getNBMonRarityData = async () => {
    try {
        const NBMon = mongoose.model('NBMonData', NBMonSchema, 'RHDiscordNBMonData');
        const rarityInfo = [];

        const nbmonQuery = await NBMon.find();

        // for each rarity, get the amount of NBMons that have that rarity.
        for (let i = 0; i < nbmonQuery.length; i++) {
            const nbmon = nbmonQuery[i];

            const rarityIndex = rarityInfo.findIndex((rarity) => rarity.rarity === nbmon.rarity);
            if (rarityIndex === -1) {
                rarityInfo.push({
                    rarity: nbmon.rarity,
                    count: 1,
                });
            } else {
                rarityInfo[rarityIndex].count++;
            }
        }

        // sort the rarityInfo array by the amount of NBMons that have that rarity.
        rarityInfo.sort((a, b) => b.count - a.count);

        console.log(rarityInfo);
    } catch (err) {
        console.log({
            errorFrom: 'getNBMonRarityData',
            errorMessage: err,
        });
    }
};

const favorPointsData = async () => {
    try {
        const User = mongoose.model('UserData', DiscordUserSchema, 'RHDiscordUserData');
        const userQuery = await User.find().sort({ realmPoints: -1 });

        const highestFP = userQuery[0].realmPoints;
        const lowestFP = userQuery[userQuery.length - 1].realmPoints ? userQuery[userQuery.length - 1].realmPoints : 0;

        // get the average FP of all users.
        const averageFP = userQuery.reduce((acc, user) => acc + (user.realmPoints ? user.realmPoints : 0), 0) / userQuery.length;

        // top 50 users with the most favor points (data)
        const top50 = userQuery.slice(0, 50);
        const lowestOfTop50FP = top50[top50.length - 1].realmPoints;
        const averageOfTop50FP = top50.reduce((acc, user) => acc + user.realmPoints, 0) / top50.length;

        console.log(highestFP, lowestFP, averageFP.toFixed(0));
        console.log(lowestOfTop50FP, averageOfTop50FP.toFixed(0));
    } catch (err) {
        console.log({
            errorFrom: 'favorPointsData',
            errorMessage: err,
        });
    }
};

module.exports = {
    getNBMonXPData,
    getNBMonGenusData,
    getNBMonRarityData,
    favorPointsData,
};
