const { representativeVotingModal, rescindRepresentativeVoteModal } = require('../../modals/nations');
const { getCurrentVotesAvailable, getVotersNation, rescindVote, checkVotersNominees } = require('../../utils/genesisTrials/nations');

const nationLeadVotesInteraction = async (interaction) => {
    try {
        switch (interaction.customId) {
            case 'nationRepresentativeVoteButton':
                await interaction.reply({ content: 'Voting closed.', ephemeral: true });
                return;
                // const { status: voterStatus, message: voterMessage } = await getCurrentVotesAvailable(interaction);
                // // if there's an error when getting the votes, send the error message. else, proceed.
                // if (voterStatus === 'error') {
                //     await interaction.reply({ content: voterMessage, ephemeral: true });
                //     return;
                // }

                // // get the user's nation first
                // const { status: nationStatus, message: nationMessage, nation } = await getVotersNation(interaction.user.id);
                // if there's an error, send the error message.
                if (nationStatus === 'error') {
                    await interaction.reply({ content: nationMessage, ephemeral: true });
                    return;
                } else {
                    await interaction.showModal(representativeVotingModal(nation));
                    return;
                }
            case 'nationRepresentativeRescindVoteButton':
                await interaction.reply({ content: 'Voting closed.', ephemeral: true });
                // await interaction.showModal(rescindRepresentativeVoteModal);
                // return;
            case 'nationRepresentativeCheckVotesLeftButton':
                const { message: currentVotesMsg } = await getCurrentVotesAvailable(interaction);
                return await interaction.reply({ content: currentVotesMsg, ephemeral: true });
            case 'nationRepresentativeCheckVotesButton':
                const { message: checkVotesMsg } = await checkVotersNominees(interaction.user.id);
                return await interaction.reply({ content: checkVotesMsg, ephemeral: true });
        }
    } catch (err) {
        console.log({
            errorFrom: 'nationLeadVotesInteraction',
            errorMessage: err,
        });
    }
};

module.exports = {
    nationLeadVotesInteraction,
};
