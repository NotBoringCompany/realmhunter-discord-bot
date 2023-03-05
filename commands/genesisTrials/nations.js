const { nationRoleEmbed } = require('../../embeds/genesisTrials/nations');
const { nationRoles } = require('../../utils/genesisTrials/nations');

const showNationRoleEmbed = async (message) => {
    try {
        await message.channel.send({
            embeds: [nationRoleEmbed],
            components: [
                {
                    type: 1,
                    components: nationRoles().firstNationsBatch,
                },
                {
                    type: 1,
                    components: nationRoles().secondNationsBatch,
                },
                {
                    type: 1,
                    components: nationRoles().thirdNationsBatch,
                },
                {
                    type: 1,
                    components: nationRoles().fourthNationsBatch,
                },
                {
                    type: 1,
                    components: nationRoles().fifthNationsBatch,
                },
            ],
        });
    } catch (err) {
        throw err;
    }
};

module.exports = {
    showNationRoleEmbed,
};
