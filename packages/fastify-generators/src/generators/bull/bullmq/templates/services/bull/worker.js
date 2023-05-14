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
exports.createWorker = void 0;
var bullmq_1 = require("bullmq");
var _error_logger_1 = require("%error-logger");
var _logger_service_1 = require("%logger-service");
var _fastify_redis_1 = require("%fastify-redis");
function createWorker(queueName, processor, options) {
    var worker = new bullmq_1.Worker(queueName, processor, __assign({ connection: (0, _fastify_redis_1.getRedisClient)() }, options));
    worker.on('active', function (job) {
        _logger_service_1.logger.info("".concat(job.queueName, ": Starting ").concat(job.name, "..."));
    });
    worker.on('completed', function (job) {
        _logger_service_1.logger.info("".concat(job.queueName, ": Completed ").concat(job.name));
    });
    worker.on('failed', function (job, err) {
        _logger_service_1.logger.info("".concat(job.queueName, ": Failed ").concat(job.name, " (").concat(err.message, ")"));
        (0, _error_logger_1.logError)(err);
    });
    return worker;
}
exports.createWorker = createWorker;
