const { nationRoleEmbed, representativeVotingEmbed, stakeTagsEmbed } = require('../../embeds/genesisTrials/nations');
const { nationRoles, representativeVoteButtons, stakeTagsButtons } = require('../../utils/genesisTrials/nations');

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
        console.log({
            errorFrom: 'showNationRoleEmbed',
            errorMessage: err,
        });
    }
};

const showRepresentativeVotingEmbed = async (message) => {
    try {
        await message.channel.send({
            embeds: [representativeVotingEmbed],
            components: [
                {
                    type: 1,
                    components: representativeVoteButtons(),
                },
            ],
        });
    } catch (err) {
        console.log({
            errorFrom: 'showRepresentativeVotingEmbed',
            errorMessage: err,
        });
    }
};

const showStakeTagsEmbed = async (message) => {
    try {
        await message.channel.send({
            embeds: [stakeTagsEmbed],
            components: [
                {
                    type: 1,
                    components: stakeTagsButtons(),
                },
            ],
        });
    } catch (err) {
        console.log({
            errorFrom: 'showStakeTagsEmbed',
            errorMessage: err,
        });
    }
};

module.exports = {
    showNationRoleEmbed,
    showRepresentativeVotingEmbed,
    showStakeTagsEmbed,
};
