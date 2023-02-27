const { randomBytes } = require('crypto');

/**
 * `randomString` generates a random string of a given size.
 * @param {Number} size the size of the string to be generated.
 * @return {String} the generated string.
 */
const randomString = (size) => {
    if (size === 0) {
        throw new Error('Zero length string.');
    }

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' + 'abcdefghijklmnopqrstuvwxyz' + '0123456789';
    let str = '';
    const bytes = randomBytes(size);
    for (let i = 0; i < bytes.length; i++) {
        str += chars[bytes.readUInt8(i) % chars.length];
    }

    return str;
};

/**
 * `generateObjectId` generates a random object ID for all MongoDB documents.
 * We generate the object ID this way so that Parse can read the data and display it in the dashboard.
 * @return {String} the generated object id.
 */
const generateObjectId = () => {
    return randomString(10);
};

module.exports = {
    randomString,
    generateObjectId,
};

