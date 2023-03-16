const { EmbedBuilder } = require('discord.js');

const nbmonAppearanceEmbed = (rarity, id, nbmon, image) => {
    return new EmbedBuilder()
        .setColor(0x42ca9f)
        .setTitle(`A(n) ${rarity.toLowerCase()} ${nbmon} (ID: ${id}) has approached the vicinity!`)
        .setImage(image)
        .setDescription(`Type !hunt captureNBMon <ID> to capture it. First citizen to do so gets the NBMon.`);
};

module.exports = {
    nbmonAppearanceEmbed,
};
