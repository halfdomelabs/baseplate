"use strict";
exports.__esModule = true;
exports.getRedisClient = exports.createRedisClient = void 0;
// @ts-nocheck
var ioredis_1 = require("ioredis");
function createRedisClient() {
    return new ioredis_1["default"](CONFIG.REDIS_URL, {
        maxRetriesPerRequest: null
    });
}
exports.createRedisClient = createRedisClient;
var cachedRedisClient = null;
function getRedisClient() {
    if (cachedRedisClient === null) {
        cachedRedisClient = createRedisClient();
    }
    return cachedRedisClient;
}
exports.getRedisClient = getRedisClient;
