require('dotenv').config();
const mongoose = require('mongoose');
const { generateObjectId } = require('../cryptoUtils');
const permissions = require('../dbPermissions');
const { DiscordUserSchema } = require('../schemas');

/**
 * All currently available nations to choose from (from the poll results).
 */
const nationRoles = () => {
    // we will have to divide them into multiple batches of 5 due to Discord's limitations of 5 buttons per row
    const firstNationsBatch = [
        nationTemplate('China'),
        nationTemplate('Japan'),
        nationTemplate('Indonesia'),
        nationTemplate('Vietnam'),
        nationTemplate('Philippines'),
    ];

    const secondNationsBatch = [
        nationTemplate('Russia'),
        nationTemplate('Germany'),
        nationTemplate('Ukraine'),
        nationTemplate('France'),
        nationTemplate('Serbia'),
    ];

    const thirdNationsBatch = [
        nationTemplate('Pakistan'),
        nationTemplate('India'),
        nationTemplate('Bangladesh'),
        nationTemplate('Korea'),
        nationTemplate('Turkey'),
    ];

    const fourthNationsBatch = [
        nationTemplate('Nigeria'),
        nationTemplate('USA'),
        nationTemplate('Brazil'),
        nationTemplate('Spain'),
        nationTemplate('UK'),
    ];

    const fifthNationsBatch = [
        nationTemplate('Canada'),
        nationTemplate('Malaysia'),
        nationTemplate('Italy'),
        nationTemplate('Thailand'),
    ];

    return {
        firstNationsBatch,
        secondNationsBatch,
        thirdNationsBatch,
        fourthNationsBatch,
        fifthNationsBatch,
    };
};

/**
 * Template for nation roles.
 */
const nationTemplate = (nation) => {
    return {
        type: 2,
        style: 1,
        label: nation,
        custom_id: `${nation.toLowerCase()}NationRoleButton`,
    };
};

/**
 * Gives a user a nation role depending on which one they chose.
 */
const giveNationRole = async (interaction, role) => {
    try {
        let roleToGive;

        switch (role.toLowerCase()) {
            case 'china':
                roleToGive = interaction.guild.roles.cache.find(r => r.id === process.env.CHINA_ROLEID);
                break;
            case 'japan':
                roleToGive = interaction.guild.roles.cache.find(r => r.id === process.env.JAPAN_ROLEID);
                break;
            case 'indonesia':
                roleToGive = interaction.guild.roles.cache.find(r => r.id === process.env.INDONESIA_ROLEID);
                break;
            case 'vietnam':
                roleToGive = interaction.guild.roles.cache.find(r => r.id === process.env.VIETNAM_ROLEID);
                break;
            case 'philippines':
                roleToGive = interaction.guild.roles.cache.find(r => r.id === process.env.PHILIPPINES_ROLEID);
                break;
            case 'russia':
                roleToGive = interaction.guild.roles.cache.find(r => r.id === process.env.RUSSIA_ROLEID);
                break;
            case 'germany':
                roleToGive = interaction.guild.roles.cache.find(r => r.id === process.env.GERMANY_ROLEID);
                break;
            case 'ukraine':
                roleToGive = interaction.guild.roles.cache.find(r => r.id === process.env.UKRAINE_ROLEID);
                break;
            case 'france':
                roleToGive = interaction.guild.roles.cache.find(r => r.id === process.env.FRANCE_ROLEID);
                break;
            case 'serbia':
                roleToGive = interaction.guild.roles.cache.find(r => r.id === process.env.SERBIA_ROLEID);
                break;
            case 'pakistan':
                roleToGive = interaction.guild.roles.cache.find(r => r.id === process.env.PAKISTAN_ROLEID);
                break;
            case 'india':
                roleToGive = interaction.guild.roles.cache.find(r => r.id === process.env.INDIA_ROLEID);
                break;
            case 'bangladesh':
                roleToGive = interaction.guild.roles.cache.find(r => r.id === process.env.BANGLADESH_ROLEID);
                break;
            case 'korea':
                roleToGive = interaction.guild.roles.cache.find(r => r.id === process.env.KOREA_ROLEID);
                break;
            case 'turkey':
                roleToGive = interaction.guild.roles.cache.find(r => r.id === process.env.TURKEY_ROLEID);
                break;
            case 'nigeria':
                roleToGive = interaction.guild.roles.cache.find(r => r.id === process.env.NIGERIA_ROLEID);
                break;
            case 'usa':
                roleToGive = interaction.guild.roles.cache.find(r => r.id === process.env.USA_ROLEID);
                break;
            case 'brazil':
                roleToGive = interaction.guild.roles.cache.find(r => r.id === process.env.BRAZIL_ROLEID);
                break;
            case 'spain':
                roleToGive = interaction.guild.roles.cache.find(r => r.id === process.env.SPAIN_ROLEID);
                break;
            case 'uk':
                roleToGive = interaction.guild.roles.cache.find(r => r.id === process.env.UK_ROLEID);
                break;
            case 'canada':
                roleToGive = interaction.guild.roles.cache.find(r => r.id === process.env.CANADA_ROLEID);
                break;
            case 'malaysia':
                roleToGive = interaction.guild.roles.cache.find(r => r.id === process.env.MALAYSIA_ROLEID);
                break;
            case 'italy':
                roleToGive = interaction.guild.roles.cache.find(r => r.id === process.env.ITALY_ROLEID);
                break;
            case 'thailand':
                roleToGive = interaction.guild.roles.cache.find(r => r.id === process.env.THAILAND_ROLEID);
                break;
        }

        // now we add the nation to the user's data.
        const User = mongoose.model('User', DiscordUserSchema, 'RHDiscordUserData');
        const userQuery = await User.findOne({ userId: interaction.user.id });

        // if query isn't found, then we create a new user instance.
        if (!userQuery) {
            const { _wperm, _rperm, _acl } = permissions(true, false);

            const NewUser = new User(
                {
                    _id: generateObjectId(),
                    _created_at: Date.now(),
                    _updated_at: Date.now(),
                    _wperm: _wperm,
                    _rperm: _rperm,
                    _acl: _acl,
                    userId: interaction.user.id,
                    hunterTags: 0,
                    realmPoints: 0,
                    dailyTagsClaimed: false,
                    dailyContributionTagsClaimed: false,
                    contributionTagsEarned: 0,
                    timesDistributionTagsClaimed: 0,
                    nation: roleToGive.name,
                },
            );

            await interaction.member.roles.add(roleToGive);

            await NewUser.save();

            return {
                success: true,
                message: `You have joined Nation ${roleToGive.name}!`,
            };
        // if query is found, then we first check if the user already joined a nation.
        } else {
            const nation = userQuery.nation;

            // if they're not in a nation yet, we add the nation to their data.
            if (!nation) {
                await interaction.member.roles.add(roleToGive);

                userQuery.nation = roleToGive.name;

                await userQuery.save();

                return {
                    success: true,
                    message: `You have joined Nation ${roleToGive.name}!`,
                };
            // otherwise, we will do 2 things:
            // 1. remove the user's current nation role from discord and add their new nation role.
            // 2. update the user's nation in the database.
            } else {
                // remove user's current nation role from discord
                const currentNationRole = interaction.guild.roles.cache.find(r => r.name === nation);
                await interaction.member.roles.remove(currentNationRole.id);

                // once removed, we add the new nation role to the user.
                await interaction.member.roles.add(roleToGive);

                // now we update the user's nation in the database.
                userQuery.nation = roleToGive.name;

                await userQuery.save();

                return {
                    success: true,
                    message: `You have joined Nation ${roleToGive.name}!`,
                };
            }
        }
    } catch (err) {
        console.log({
            errorFrom: 'giveNationRole',
            errorMessage: err,
        });
    }
};

module.exports = {
    nationRoles,
    giveNationRole,
    nationTemplate,
};
