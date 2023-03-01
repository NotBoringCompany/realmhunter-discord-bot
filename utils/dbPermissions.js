/**
 * Templates for Parse DB permissions, also stored in MongoDB documents.
 */
const permissions = (read, write) => {
    const _wperm = write ? ['*'] : [];
    const _rperm = read ? ['*'] : [];

    let _acl;

    // read and write enabled
    if (_wperm.length !== 0 && _rperm.length !== 0) {
        _acl = {
            '*': {
                'r': true,
                'w': true,
            },
        };
    // read only
    } else if (_wperm.length !== 0 && _rperm.length === 0) {
        _acl = {
            '*': {
                'r': true,
            },
        };
    // write only
    } else if (_wperm.length === 0 && _rperm.length !== 0) {
        _acl = {
            '*': {
                'w': true,
            },
        };
    // master key only
    } else {
        _acl = {};
    }

    return {
        _wperm: _wperm,
        _rperm: _rperm,
        _acl: _acl,
    };
};

module.exports = permissions;
