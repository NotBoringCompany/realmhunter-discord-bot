/**
 * Creates a role in the server.
 */
const createRoleLogic = async (message, role) => {
    try {
        await message.guild.roles.create({
            name: role,
            color: '0x4aace4',
        });

        return {
            status: 'success',
            message: `Role ${role} created!`,
        };
    } catch (err) {
        console.log({
            errorFrom: 'createRole',
            errorMessage: err,
        });
    }
};

module.exports = {
    createRoleLogic,
};
