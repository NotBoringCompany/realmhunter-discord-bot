const { claimDailyTagsEmbed } = require('../../embeds/genesisTrials/claimTags');
const { claimDailyTagsLogic } = require('../../utils/genesisTrials/claimTags');

/**
 * Show the embed for claiming daily tags.
 */
const showClaimDailyTagsEmbed = async (message) => {
    try {
        await message.channel.send({
            embeds: [claimDailyTagsEmbed],
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            style: 1,
                            label: 'Claim your daily tags',
                            custom_id: 'claimDailyTagsButton',
                        },
                    ],
                },
            ],
        });
    } catch (err) {
        throw err;
    }
};

/**
 * Executed when a user clicks on the `claim daily tags` button.
 * Calls the `claimDailyTagsLogic` function to check if the user can claim their daily tags.
 */
const claimDailyTags = async (interaction) => {
    try {
        return await claimDailyTagsLogic(interaction);
    } catch (err) {
        throw err;
    }
};

module.exports = {
    showClaimDailyTagsEmbed,
    claimDailyTags,
};
