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
            name: 'Pfufu',
            imageUrl: imageUrl('pfufu'),
        },
        {
            name: 'Roggo',
            imageUrl: imageUrl('roggo'),
        },
        {
            name: 'Birvo',
            imageUrl: imageUrl('birvo'),
        },
        {
            name: 'Pongu',
            imageUrl: imageUrl('pongu'),
        },
        {
            name: 'Heree',
            imageUrl: imageUrl('heree'),
        },
        {
            name: 'Todillo',
            imageUrl: imageUrl('todillo'),
        },
        {
            name: 'Schoggi',
            imageUrl: imageUrl('schoggi'),
        },
        {
            name: 'Milnas',
            imageUrl: imageUrl('milnas'),
        },
        {
            name: 'Licorine',
            imageUrl: imageUrl('licorine'),
        },
        {
            name: 'Dranexx',
            imageUrl: imageUrl('dranexx'),
        },
        {
            name: 'Lamox',
            imageUrl: imageUrl('lamox'),
        },
    ];

    const firstRelease = process.env.FIRST_NBMONS_RELEASE_TIMESTAMP;
    const secondRelease = process.env.SECOND_NBMONS_RELEASE_TIMESTAMP;
    const thirdRelease = process.env.THIRD_NBMONS_RELEASE_TIMESTAMP;

    const now = Math.floor(new Date().getTime() / 1000);

    let genusRand;

    if (now < secondRelease) {
        // get the first 4 to randomize.
        genusRand = Math.floor(Math.random() * 4);
    } else if (now < thirdRelease) {
        genusRand = Math.floor(Math.random() * 7);
    } else if (now > thirdRelease) {
        // get the whole length of the array.
        genusRand = Math.floor(Math.random() * genera.length);
    }
    return genera[genusRand];
};

const bossHp = async () => {
    // boss hp is calculated so that it can be attacked 500 - 2000 times.
    // for this, we will need to get the average damage of ALL NBMons and therefore will need to query the NBMon database.
    const NBMon = mongoose.model('NBMonData', NBMonSchema, 'RHDiscordNBMonData');

    // get the attack of ALL NBMons and divide it by the length of the query.
    const nbmonQuery = await NBMon.find({});
    const bossHp = nbmonQuery.reduce((acc, nbmon) => acc + nbmon.atk, 0) / nbmonQuery.length;

    // rand between 500 - 2000
    const rand = Math.floor(Math.random() * 1501) + 500;

    return Math.floor(bossHp * rand);
};

const imageUrl = (genus) => {
    switch (genus.toLowerCase()) {
        case 'pfufu':
            return 'https://i.imgur.com/FQD719p.png';
        case 'roggo':
            return 'https://i.imgur.com/4OTvffy.png';
        case 'birvo':
            return 'https://i.imgur.com/up45Qyp.png';
        case 'pongu':
            return 'https://i.imgur.com/xtIRJpN.png';
        case 'dranexx':
            return 'https://i.imgur.com/DNv8m9y.png';
        case 'lamox':
            return 'https://i.imgur.com/flAEvZY.png';
        case 'schoggi':
            return 'https://i.imgur.com/i3uVyWe.png';
        case 'milnas':
            return 'https://i.imgur.com/IuNlEe2.png';
        case 'licorine':
            return 'https://i.imgur.com/E6nNsSh.png';
        case 'heree':
            return 'https://i.imgur.com/4UeFbP4.png';
        case 'scorpio':
            return 'https://i.imgur.com/fG3vTB3.png';
        case 'todillo':
            return 'https://i.imgur.com/C8Mi3OL.png';
    }
};

module.exports = {
    rarity,
    genusData,
    bossHp,
    imageUrl,
};

