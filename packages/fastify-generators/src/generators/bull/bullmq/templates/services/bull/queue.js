"use strict";
// @ts-nocheck
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
exports.getOrCreateManagedQueue = void 0;
var bullmq_1 = require("bullmq");
var _error_logger_1 = require("%error-logger");
var _fastify_redis_1 = require("%fastify-redis");
var managedQueues = {};
function getOrCreateManagedQueue(queueName, options) {
    if (managedQueues[queueName]) {
        return managedQueues[queueName];
    }
    var queue = new bullmq_1.Queue(queueName, __assign(__assign({ connection: (0, _fastify_redis_1.getRedisClient)() }, options), { defaultJobOptions: __assign({ 
            // keep last 100 jobs before removing them
            removeOnComplete: { count: 100 } }, options === null || options === void 0 ? void 0 : options.defaultJobOptions) }));
    queue.on('error', function (err) {
        (0, _error_logger_1.logError)(err);
    });
    managedQueues[queueName] = queue;
    return queue;
}
exports.getOrCreateManagedQueue = getOrCreateManagedQueue;
