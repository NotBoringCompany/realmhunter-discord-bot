const { claimDailyTagsEmbed } = require('../../embeds/genesisTrials/dailyTags');
const { claimDailyTagsLogic } = require('../../utils/genesisTrials/dailyTags');


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
        console.log({
            errorFrom: 'showClaimDailyTagsEmbed',
            errorMessage: err.message,
        });
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
        console.log({
            errorFrom: 'claimDailyTags',
            errorMessage: err.message,
        });
    }
};

module.exports = {
    showClaimDailyTagsEmbed,
    claimDailyTags,
};
