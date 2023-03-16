const { EmbedBuilder } = require('discord.js');

const randomWildNBMonAppearanceEmbed = (nbmon, image) => {
    return new EmbedBuilder()
        .setColor(0x42ca9f)
        .setTitle(`A ${nbmon} has approached the vicinity!`)
        .setImage(image)
        .setDescription(`Type !hunt captureNBMon <ID> to capture it. First citizen to do so gets the NBMon.`);
};

module.exports = {
    randomWildNBMonAppearanceEmbed,
};
