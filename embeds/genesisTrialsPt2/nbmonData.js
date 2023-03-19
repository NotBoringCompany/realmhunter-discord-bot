const { EmbedBuilder } = require('discord.js');
const { imageUrl } = require('../../utils/genesisTrialsPt2/nbmonStatRandomizer');

const checkNBMonsOwnedEmbed = new EmbedBuilder()
    .setColor(0x42ca9f)
    .setTitle('Check NBMons owned')
    .setDescription(`Click on the 'Check NBMon IDs owned' button to get the list of NBMons you own via their IDs. Then, you can get the data for one NBMon at a time by using its ID.`);

const nbmonDataEmbed = (nbmonData) => {
    const name = nbmonData.customName ? nbmonData.customName : `NBMon #${nbmonData.nbmonId}`;
    return new EmbedBuilder()
        .setColor(0x42ca9f)
        .setTitle(`${name}`)
        .setImage(imageUrl(nbmonData.genus.toLowerCase()))
        .setFields(
            { name: '__**Genus**__', value: `${nbmonData.genus}` },
            { name: '__**Rarity**__', value: `${nbmonData.rarity}` },
            { name: '__**XP gained**__', value: `${nbmonData.xp}` },
            { name: '__**HP**__', value: `${nbmonData.currentHp}/${nbmonData.maxHp}` },
            { name: '__**Attack**__', value: `${nbmonData.atk}` },
        );
};

module.exports = {
    checkNBMonsOwnedEmbed,
    nbmonDataEmbed,
};
