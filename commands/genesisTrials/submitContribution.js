const { submitContributionEmbed } = require('../../embeds/genesisTrials/submitContribution');


/**
 * Show the embed for submitting Realm Hunter community contribution works.
 */
const showSubmitContributionEmbed = async (message) => {
    try {
        await message.channel.send({
            embeds: [submitContributionEmbed],
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            style: 1,
                            label: 'Submit your work',
                            custom_id: 'submitContributionButton',
                        },
                    ],
                },
            ],
        });
    } catch (err) {
        console.log({
            errorFrom: 'showSubmitContributionEmbed',
            errorMessage: err,
        });
    }
};

module.exports = {
    showSubmitContributionEmbed,
};
