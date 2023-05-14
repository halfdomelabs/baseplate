"use strict";
// @ts-nocheck
exports.__esModule = true;
exports.getPubSub = void 0;
var node_1 = require("@graphql-yoga/node");
var redis_event_target_1 = require("@graphql-yoga/redis-event-target");
var _fastify_redis_1 = require("%fastify-redis");
var cachedPubSub = null;
function getPubSub() {
    if (cachedPubSub === null) {
        var eventTarget = (0, redis_event_target_1.createRedisEventTarget)({
            publishClient: (0, _fastify_redis_1.createRedisClient)(),
            subscribeClient: (0, _fastify_redis_1.createRedisClient)()
        });
        cachedPubSub = (0, node_1.createPubSub)({ eventTarget: eventTarget });
    }
    return cachedPubSub;
}
exports.getPubSub = getPubSub;
