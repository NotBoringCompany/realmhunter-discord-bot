const mongoose = require('mongoose');
const { generateObjectId } = require('../cryptoUtils');
const permissions = require('../dbPermissions');
const { ContributionSchema } = require('../schemas');

/**
 * Submits a community contribution work to the database.
 */
const submitContributionToDB = async (userId, url) => {
    try {
        // we first check if the user exists in the contributions database. if not, we create a new entry for them.
        const ContributionsData = mongoose.model('ContributionData', ContributionSchema, 'RHDiscordContributionData');
        const contributionsQuery = await ContributionsData.findOne({ userId: userId });

        // if contribution doesn't exist, we create a new document/user instance for them.
        if (!contributionsQuery) {
            const { _wperm, _rperm, _acl } = permissions(true, false);

            const NewContribution = new ContributionsData(
                {
                    _id: generateObjectId(),
                    _created_at: Date.now(),
                    _updated_at: Date.now(),
                    _wperm: _wperm,
                    _rperm: _rperm,
                    _acl: _acl,
                    userId: userId,
                    contributions: [
                        {
                            dateSubmitted: Date.now(),
                            url: url,
                            rewarded: false,
                        },
                    ],
                },
            );

            await NewContribution.save();
            return {
                status: 'success',
                message: 'Your contribution has been submitted. Thank you! Our team will now check your work and get back to you.',
            };
        // if user exists, we first check if they resubmitted an existing contribution.
        } else {
            const getContributions = userQuery.contributions;

            // if the user has previously submitted contributions, we check if they resubmitted an existing contribution.
            if (getContributions.length !== 0) {
                const checkForDuplicate = getContributions.find(contribution => contribution.url.toLowerCase().includes(url.toLowerCase()));
                // if no duplicates are found, we add the new contribution to the user's existing contributions.
                if (!checkForDuplicate) {
                    getContributions.push(
                        {
                            dateSubmitted: Date.now(),
                            url: url,
                            rewarded: false,
                        },
                    );

                    await userQuery.save();

                    return {
                        status: 'success',
                        message: 'Your contribution has been submitted. Thank you!',
                    };
                // if a duplicate is found, we return an error.
                } else {
                    return {
                        status: 'error',
                        message: 'You have already submitted this contribution.',
                    };
                }
            // if the user has no previous contributions, we add the new contribution to the user's existing contributions.
            } else {
                getContributions.push(
                    {
                        dateSubmitted: Date.now(),
                        url: url,
                    },
                );

                await userQuery.save();

                return {
                    status: 'success',
                    message: 'Your contribution has been submitted. Thank you!',
                };
            }
        }
    } catch (err) {
        console.log({
            errorFrom: 'submitContributionToDB',
            errorMessage: err,
        });
    }
};

module.exports = {
    submitContributionToDB,
};
