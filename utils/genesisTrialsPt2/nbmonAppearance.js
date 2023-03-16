require('dotenv').config();
const mongoose = require('mongoose');
const { generateObjectId } = require('../cryptoUtils');
const permissions = require('../dbPermissions');
const { NBMonSchema } = require('../schemas');
const { stats } = require('./nbmonStatRandomizer');

mongoose.connect(process.env.MONGODB_URI);
/**
 * Adds an NBMon to the database once it appears.
 */
const addNBMon = async (nbmonId, genus) => {
    try {
        const NBMon = mongoose.model('NBMonData', NBMonSchema, 'RHDiscordNBMonData');

        // get the NBMon data from the database to check the latest ID.

        const { _wperm, _rperm, _acl } = permissions(false, false);
        const NewNBMon = new NBMon(
            {
                _id: generateObjectId(),
                _created_at: Date.now(),
                _updated_at: Date.now(),
                _wperm: _wperm,
                _rperm: _rperm,
                _acl: _acl,
                nbmonId: nbmonId,
                genus: genus,
                appearanceTimestamp: Math.floor(new Date().getTime() / 1000),
                stats: stats(),
            },
        );

        await NewNBMon.save();

        return {
            status: 'success',
            message: 'NBMon added to database.',
        };
    } catch (err) {
        console.log({
            errorFrom: 'addNBMon',
            errorMessage: err,
        });
    }
};

module.exports = {
    addNBMon,
};
