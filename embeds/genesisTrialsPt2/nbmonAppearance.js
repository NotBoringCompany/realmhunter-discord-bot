const { EmbedBuilder } = require('discord.js');

const nbmonAppearanceEmbed = (rarity, id, nbmon, image) => {
    return new EmbedBuilder()
        .setColor(0x42ca9f)
        .setTitle(`A(n) ${rarity.toLowerCase()} ${nbmon} (ID: ${id}) has approached the vicinity!`)
        .setImage(image)
        .setDescription(`Type !hunt captureNBMon <ID> to capture the NBMon. ${process.env.CAPTURE_NBMON_TAG_REQUIREMENT} COOKIES REQUIRED TO CAPTURE!`);
};

const bossNBMonAppearanceEmbed = (id, image) => {
    return new EmbedBuilder()
        .setColor(0x42ca9f)
        .setTitle(`A mighty Boss NBMon (ID: ${id}) has just appeared. Hunt it down in <#${process.env.FOUNDERS_BOT_COMMANDS_CHANNELID}> with other fellow citizens!`)
        .setImage(image);
};

/**
 * Shows the stats of the boss NBMon
 */
const bossNBMonEmbed = (id, image, hpLeft, maxHp, attackedByCount) => {
    return new EmbedBuilder()
        .setColor(0x42ca9f)
        .setTitle(`Boss NBMon #${id}`)
        .setImage(image)
        .setDescription(`You will need to specify which NBMon (that you own) you want to use to attack the boss by providing its ID when clicking 'Attack'. \n\
        Check by clicking the 'Check owned NBMon IDs' button.`)
        .setFields(
            {
                name: '__**HP Left**__',
                value: `${hpLeft}/${maxHp}`,
            },
            {
                name: '__**Attacked By**__',
                value: `${attackedByCount} citizens`,
            },
        );
};

module.exports = {
    nbmonAppearanceEmbed,
    bossNBMonAppearanceEmbed,
    bossNBMonEmbed,
};
