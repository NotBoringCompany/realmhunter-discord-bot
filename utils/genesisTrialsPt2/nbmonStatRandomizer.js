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

const bossHp = () => {
    // boss hp changes every day. starting from 18 march, it will return 3000 - 5000.
    // 18 march: 3000 - 5000
    // 19 march: 4000 - 6000
    // 20 march: 5000 - 7000
    // 21 march: 6000 - 8000
    // 22 march: 7500 - 10000
    // 23 march: 10000 - 12500
    // 24 march: 12500 - 17500
    // 25 march: 17500 - 25000
    return Math.floor(Math.random() * 2000) + 3000;
};

module.exports = {
    rarity,
    genusData,
    bossHp,
};

