const { giveNationRole } = require('../../utils/genesisTrials/nations');

const nationButtonInteraction = async (interaction) => {
    try {
        switch (interaction.customId) {
            case 'chinaNationRoleButton':
                const chinaRole = await giveNationRole(interaction, 'China');
                return await interaction.reply({ content: chinaRole.message, ephemeral: true });
            case 'japanNationRoleButton':
                const japanRole = await giveNationRole(interaction, 'Japan');
                return await interaction.reply({ content: japanRole.message, ephemeral: true });
            case 'indonesiaNationRoleButton':
                const indonesiaRole = await giveNationRole(interaction, 'Indonesia');
                return await interaction.reply({ content: indonesiaRole.message, ephemeral: true });
            case 'vietnamNationRoleButton':
                const vietnamRole = await giveNationRole(interaction, 'Vietnam');
                return await interaction.reply({ content: vietnamRole.message, ephemeral: true });
            case 'philippinesNationRoleButton':
                const philippinesRole = await giveNationRole(interaction, 'Philippines');
                return await interaction.reply({ content: philippinesRole.message, ephemeral: true });
            case 'russiaNationRoleButton':
                const russiaRole = await giveNationRole(interaction, 'Russia');
                return await interaction.reply({ content: russiaRole.message, ephemeral: true });
            case 'germanyNationRoleButton':
                const germanyRole = await giveNationRole(interaction, 'Germany');
                return await interaction.reply({ content: germanyRole.message, ephemeral: true });
            case 'ukraineNationRoleButton':
                const ukraineRole = await giveNationRole(interaction, 'Ukraine');
                return await interaction.reply({ content: ukraineRole.message, ephemeral: true });
            case 'franceNationRoleButton':
                const franceRole = await giveNationRole(interaction, 'France');
                return await interaction.reply({ content: franceRole.message, ephemeral: true });
            case 'serbiaNationRoleButton':
                const serbiaRole = await giveNationRole(interaction, 'Serbia');
                return await interaction.reply({ content: serbiaRole.message, ephemeral: true });
            case 'pakistanNationRoleButton':
                const pakistanRole = await giveNationRole(interaction, 'Pakistan');
                return await interaction.reply({ content: pakistanRole.message, ephemeral: true });
            case 'indiaNationRoleButton':
                const indiaRole = await giveNationRole(interaction, 'India');
                return await interaction.reply({ content: indiaRole.message, ephemeral: true });
            case 'bangladeshNationRoleButton':
                const bangladeshRole = await giveNationRole(interaction, 'Bangladesh');
                return await interaction.reply({ content: bangladeshRole.message, ephemeral: true });
            case 'koreaNationRoleButton':
                const koreaRole = await giveNationRole(interaction, 'Korea');
                return await interaction.reply({ content: koreaRole.message, ephemeral: true });
            case 'turkeyNationRoleButton':
                const turkeyRole = await giveNationRole(interaction, 'Turkey');
                return await interaction.reply({ content: turkeyRole.message, ephemeral: true });
            case 'nigeriaNationRoleButton':
                const nigeriaRole = await giveNationRole(interaction, 'Nigeria');
                return await interaction.reply({ content: nigeriaRole.message, ephemeral: true });
            case 'usaNationRoleButton':
                const usaRole = await giveNationRole(interaction, 'USA');
                return await interaction.reply({ content: usaRole.message, ephemeral: true });
            case 'brazilNationRoleButton':
                const brazilRole = await giveNationRole(interaction, 'Brazil');
                return await interaction.reply({ content: brazilRole.message, ephemeral: true });
            case 'spainNationRoleButton':
                const spainRole = await giveNationRole(interaction, 'Spain');
                return await interaction.reply({ content: spainRole.message, ephemeral: true });
            case 'ukNationRoleButton':
                const ukRole = await giveNationRole(interaction, 'UK');
                return await interaction.reply({ content: ukRole.message, ephemeral: true });
            case 'canadaNationRoleButton':
                const canadaRole = await giveNationRole(interaction, 'Canada');
                return await interaction.reply({ content: canadaRole.message, ephemeral: true });
            case 'malaysiaNationRoleButton':
                const malaysiaRole = await giveNationRole(interaction, 'Malaysia');
                return await interaction.reply({ content: malaysiaRole.message, ephemeral: true });
            case 'italyNationRoleButton':
                const italyRole = await giveNationRole(interaction, 'Italy');
                return await interaction.reply({ content: italyRole.message, ephemeral: true });
            case 'thailandNationRoleButton':
                const thailandRole = await giveNationRole(interaction, 'Thailand');
                return await interaction.reply({ content: thailandRole.message, ephemeral: true });
        }
    } catch (err) {
        console.log({
            errorFrom: 'nationButtonInteraction',
            errorMessage: err,
        });
    }
};

module.exports = {
    nationButtonInteraction,
};
