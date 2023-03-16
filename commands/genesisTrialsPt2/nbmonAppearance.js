const { captureNBMonLogic } = require('../../utils/genesisTrialsPt2/nbmonAppearance');

const captureNBMon = async (message) => {
    try {
        const [hunt, captureNBMon, id, ...rest] = message.content.split(' ');

        if (isNaN(id) || (!id)) {
            return {
                status: 'error',
                message: 'Please provide the ID of the NBMon you want to capture.',
            };
        }

        return await captureNBMonLogic(id, message.author.id);
    } catch (err) {
        console.log({
            errorFrom: 'captureNBMon',
            errorMessage: err,
        });
    }
};

module.exports = {
    captureNBMon,
};
