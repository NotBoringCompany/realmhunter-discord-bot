const { createRoleLogic } = require("../utils/discord/createRoles");

const createRole = async (message) => {
    try {
        const [command, ...role] = message.content.split(' ');

        if (command.toLowerCase() !== '!createrole') {
            return {
                status: 'error',
                message: 'Invalid command.',
            };
        }

        return await createRoleLogic(message, role[0]);
    } catch (err) {
        console.log({
            errorFrom: 'createRole',
            errorMessage: err,
        });
    }
};

module.exports = {
    createRole,
};
