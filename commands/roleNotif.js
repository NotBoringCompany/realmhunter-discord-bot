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
        throw err;
    }
};

module.exports = {
    showRoleNotifEmbed,
};
