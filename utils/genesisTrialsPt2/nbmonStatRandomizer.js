const mongoose = require('mongoose');
const { NBMonSchema } = require('../schemas');
/// All stats generated here are NOT the final calculations for the actual Realm Hunter game.
/// These stats are only used for the Genesis Trials.

const rarity = () => {
    const rarityRand = Math.floor(Math.random() * 1000) + 1;

    switch (true) {
        // 55% chance of common
        case (rarityRand <= 550):
            return 'Common';
        // 25% chance of uncommon
        case (rarityRand <= 800):
            return 'Uncommon';
        // 12.5% chance of rare
        case (rarityRand <= 925):
            return 'Rare';
        // 5.5% chance of epic
        case (rarityRand <= 980):
            return 'Epic';
        // 1.8% chance of legendary
        case (rarityRand <= 998):
            return 'Legendary';
        // 0.2% chance of mythic
        case (rarityRand <= 1000):
            return 'Mythic';
    }
};

const genusData = () => {
    // everyday, new genera will be available. but for now, these are the available ones:
    const genera = [
        {
            name: 'Roggo',
            image: 'https://i.imgur.com/dknMetM.png',
        },
        {
            name: 'Birvo',
            image: 'https://i.imgur.com/yn0edec.png',
        },
        {
            name: 'Dranexx',
            image: 'https://i.imgur.com/R0TYgP1.png',
        },
    ];

    const genusRand = Math.floor(Math.random() * genera.length);

    console.log(genera[genusRand]);
    return genera[genusRand];
};

const bossHp = async () => {
    // boss hp is calculated so that it can be attacked 500 - 1500 times.
    // for this, we will need to get the average damage of ALL NBMons and therefore will need to query the NBMon database.
    const NBMon = mongoose.model('NBMonData', NBMonSchema, 'RHDiscordNBMonData');

    // get the attack of ALL NBMons and divide it by the length of the query.
    const nbmonQuery = await NBMon.find({});
    const bossHp = nbmonQuery.reduce((acc, nbmon) => acc + nbmon.atk, 0) / nbmonQuery.length;

    // rand between 500 - 1500
    const rand = Math.floor(Math.random() * 1001) + 500;

    return bossHp * rand;
};

module.exports = {
    rarity,
    genusData,
    bossHp,
};

