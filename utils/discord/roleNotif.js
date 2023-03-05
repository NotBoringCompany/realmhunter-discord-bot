
/**
 * All currently available notif (short for notification) roles.
 */
const notifRoles = () => {
    return [
        {
            type: 2,
            style: 1,
            label: 'Founder Tweet Notif Gang',
            custom_id: 'founderTweetNotifGangButton',
        },
        {
            type: 2,
            style: 1,
            label: 'Daily Cookies Reset Notif',
            custom_id: 'dailyTagsResetNotifButton',
        },
    ];
};

/**
 * Gives a user a notif role depending on which one they chose.
 */
const giveRole = async (interaction, role) => {
    try {
        let roleToGive;

        if (role === 'founderTweetNotifGang') {
            roleToGive = interaction.guild.roles.cache.find(r => r.id === process.env.FOUNDER_TWEET_NOTIF_GANG_ROLEID);
        } else if (role === 'dailyTagsResetNotif') {
            roleToGive = interaction.guild.roles.cache.find(r => r.id === process.env.DAILY_TAGS_RESET_NOTIF_ROLEID);
        }

        await interaction.member.roles.add(roleToGive);

        return {
            status: 'success',
            message: `You now have the ${roleToGive.name} role!`,
        };
    } catch (err) {
        console.log({
            errorFrom: 'giveRole',
            errorMessage: err.message,
        });
    }
};

module.exports = {
    notifRoles,
    giveRole,
};


