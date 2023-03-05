const { roleNotifEmbed } = require('../embeds/roleNotif');
const { notifRoles } = require('../utils/discord/roleNotif');

const showRoleNotifEmbed = async (message) => {
    try {
        await message.channel.send({
            embeds: [roleNotifEmbed],
            components: [
                {
                    type: 1,
                    components: notifRoles(),
                },
            ],
        });
    } catch (err) {
        console.log({
            errorFrom: 'showRoleNotifEmbed',
            errorMessage: err,
        });
    }
};

module.exports = {
    showRoleNotifEmbed,
};
