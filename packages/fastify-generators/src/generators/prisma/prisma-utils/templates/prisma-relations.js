"use strict";
exports.__esModule = true;
exports.createPrismaDisconnectOrConnectData = void 0;
/**
 * Small helper function to make it easier to use optional relations in Prisma since the
 * only way to set a Prisma relation to null is to disconnect it.
 *
 * See https://github.com/prisma/prisma/issues/5044
 */
function createPrismaDisconnectOrConnectData(data) {
    if (data === undefined) {
        return undefined;
    }
    if (data === null) {
        return { disconnect: true };
    }
    return data;
}
exports.createPrismaDisconnectOrConnectData = createPrismaDisconnectOrConnectData;
