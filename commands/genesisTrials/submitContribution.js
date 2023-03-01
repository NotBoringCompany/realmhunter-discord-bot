const { submitContributionEmbed } = require('../../embeds/genesisTrials/submitContribution');


/**
 * Show the embed for submitting Realm Hunter community contribution works.
 */
const showContributionEmbed = async (message) => {
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
        throw err;
    }
};

module.exports = {
    showContributionEmbed,
};
