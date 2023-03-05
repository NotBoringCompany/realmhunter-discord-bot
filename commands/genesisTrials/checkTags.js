const { checkTagsCollectedEmbed } = require('../../embeds/genesisTrials/checkTags');

const showCheckTagsCollectedEmbed = async (message) => {
    try {
        await message.channel.send({
            embeds: [checkTagsCollectedEmbed],
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            style: 1,
                            label: 'Check collected cookies',
                            custom_id: 'checkTagsCollectedButton',
                        },
                    ],
                },
            ],
        });
    } catch (err) {
        console.log({
            errorFrom: 'showCheckTagsCollectedEmbed',
            errorMessage: err,
        });
    }
};

module.exports = {
    showCheckTagsCollectedEmbed,
};
