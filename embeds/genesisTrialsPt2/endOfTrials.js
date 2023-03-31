const { EmbedBuilder } = require('discord.js');

const tradeNBMonEmbed = new EmbedBuilder()
    .setColor(0x42ca9f)
    .setTitle('Trade your NBMon(s) for Favor Points!')
    .setDescription('As the trials are ending, you can earn additional favor points by trading all your NBMons.')
    .setFields(
        {
            name: '__**What can I trade?**__',
            value: 'You can trade all your NBMons. Depending on its XP, rarity and genus, the favor points you get will differ.',
        },
        {
            name: '__**How do I trade?**__',
            value: 'Click the `Trade` button below and insert an NBMon ID you own. If you don\'t own that NBMon, it will return an error message.',
        },
        {
            name: '__**XP Multiplier**__',
            value: 'xp^(8/9). For example, if your NBMon has 1000 XP, it will get an additional 1000^(8/9) = 464 Favor Points.',
        },
        {
            name: '__**Rarity Multiplier**__',
            value: 'Common: 0, Uncommon: 100, Rare: 250, Epic: 450, Legendary: 900, Mythical: 2500',
        },
        {
            name: '__**Genus Multiplier**__',
            value: 'If your NBMon is either: Pfufu, Roggo, Birvo or Pongu, it will grant you an additional 400 Favor Points. \n\
            If your NBMon is either: Heree, Todillo or Schoggi, it will grant you an additional 650 Favor Points. \n\
            If your NBMon is either: Milnas, Licorine, Dranexx or Lamox, it will grant you an additional 1000 Favor Points.',
        },
        {
            name: '__**Total Favor Points earned for each NBMon**__',
            value: 'Total Favor Points earned = XP + Genus + Rarity multiplier of that NBMon.',
        },
    );

module.exports = {
    tradeNBMonEmbed,
};
