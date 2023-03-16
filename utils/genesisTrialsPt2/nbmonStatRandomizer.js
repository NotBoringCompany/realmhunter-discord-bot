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

const stats = () => {
    // all stats will start as 30 for each nbmon at level 1 for the sake of simplicity.
    return {
        rarity: rarity(),
        level: 1,
        hp: 30,
        atk: 5,
        def: 30,
    };
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

module.exports = {
    rarity,
    stats,
    genusData,
};

