"use strict";
exports.__esModule = true;
exports.stripBearer = void 0;
function stripBearer(authHeader) {
    if (authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    return authHeader;
}
exports.stripBearer = stripBearer;
