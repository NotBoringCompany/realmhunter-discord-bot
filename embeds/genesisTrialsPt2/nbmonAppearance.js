const { EmbedBuilder } = require('discord.js');

const nbmonAppearanceEmbed = (rarity, id, nbmon, image) => {
    return new EmbedBuilder()
        .setColor(0x42ca9f)
        .setTitle(`A(n) ${rarity.toLowerCase()} ${nbmon} (ID: ${id}) has approached the vicinity!`)
        .setImage(image)
        .setDescription(`Type !hunt captureNBMon <ID> to capture the NBMon. 100 COOKIES REQUIRED TO CAPTURE!`);
};

module.exports = {
    nbmonAppearanceEmbed,
};
