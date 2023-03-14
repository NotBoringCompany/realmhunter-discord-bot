const { nationRoleEmbed, representativeVotingEmbed, stakeTagsEmbed, distributeNationPendingTagsEmbed } = require('../../embeds/genesisTrials/nations');
const { nationRoles, representativeVoteButtons, stakeTagsButtons, sendPendingNationTagsLogic, distributeNationPendingTagsButtons } = require('../../utils/genesisTrials/nations');

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

const sendPendingNationTags = async (message) => {
    try {
        const [hunt, rewardNation, nationName, cookiesToGive] = message.content.split(' ');

        if (nationName.charAt(0) !== nationName.charAt(0).toUpperCase()) {
            return {
                status: 'error',
                message: 'Nation name must start with a capital letter.',
                winMessage: undefined,
            };
        }

        if (isNaN(cookiesToGive)) {
            return {
                status: 'error',
                message: 'Cookies to reward must be a number.',
                winMessage: undefined,
            };
        }

        return await sendPendingNationTagsLogic(nationName, cookiesToGive);
    } catch (err) {
        console.log({
            errorFrom: 'sendPendingNationTags',
            errorMessage: err,
        });
    }
};

const showDistributeNationPendingTagsEmbed = async (message) => {
    try {
        await message.channel.send({
            embeds: [distributeNationPendingTagsEmbed],
            components: [
                {
                    type: 1,
                    components: distributeNationPendingTagsButtons(),
                },
            ],
        });
    } catch (err) {
        console.log({
            errorFrom: 'showDistributeNationPendingTagsEmbed',
            errorMessage: err,
        });
    }
};

module.exports = {
    showNationRoleEmbed,
    showRepresentativeVotingEmbed,
    showStakeTagsEmbed,
    sendPendingNationTags,
    showDistributeNationPendingTagsEmbed,
};
