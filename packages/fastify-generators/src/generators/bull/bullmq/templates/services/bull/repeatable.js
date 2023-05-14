"use strict";
// @ts-nocheck
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.synchronizeRepeatableJobs = void 0;
var _logger_service_1 = require("%logger-service");
var _fastify_redis_1 = require("%fastify-redis");
var DEFAULT_TZ = 'Etc/UTC';
/**
 * Synchronizes repeatable jobs by updating any jobs that have changed repeat schedules and adding
 * ones that are missing.
 */
function synchronizeRepeatableJobs(configs) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _logger_service_1.logger.info("Synchronizing repeatable jobs...");
                    return [4 /*yield*/, Promise.all(configs.map(function (config) { return __awaiter(_this, void 0, void 0, function () {
                            var queue, repeatableJobs;
                            var _this = this;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        queue = config.getQueue();
                                        return [4 /*yield*/, queue.getRepeatableJobs()];
                                    case 1:
                                        repeatableJobs = _a.sent();
                                        return [4 /*yield*/, Promise.all(config.jobs.map(function (job) { return __awaiter(_this, void 0, void 0, function () {
                                                var existingJob, jobHasIdenticalRepeat;
                                                return __generator(this, function (_a) {
                                                    switch (_a.label) {
                                                        case 0:
                                                            existingJob = repeatableJobs.find(function (repeatableJob) { return repeatableJob.name === job.name; });
                                                            jobHasIdenticalRepeat = existingJob &&
                                                                ((existingJob === null || existingJob === void 0 ? void 0 : existingJob.pattern) || '') ===
                                                                    (job.pattern || String(job.every) || '') &&
                                                                ((existingJob === null || existingJob === void 0 ? void 0 : existingJob.endDate) || '') ===
                                                                    ((job.endDate && new Date(job.endDate).getTime()) || '');
                                                            // if job already exists and has identical repeat, do nothing
                                                            if (jobHasIdenticalRepeat) {
                                                                return [2 /*return*/];
                                                            }
                                                            if (!(existingJob && !jobHasIdenticalRepeat)) return [3 /*break*/, 2];
                                                            _logger_service_1.logger.info("Removed duplicate repeatable job ".concat(job.name, " for queue ").concat(queue.name));
                                                            return [4 /*yield*/, queue.removeRepeatableByKey(existingJob.key)];
                                                        case 1:
                                                            _a.sent();
                                                            _a.label = 2;
                                                        case 2: 
                                                        // add job
                                                        return [4 /*yield*/, queue.add(job.name, job.data, {
                                                                repeat: {
                                                                    tz: DEFAULT_TZ,
                                                                    pattern: job.pattern,
                                                                    every: job.every,
                                                                    endDate: job.endDate
                                                                }
                                                            })];
                                                        case 3:
                                                            // add job
                                                            _a.sent();
                                                            _logger_service_1.logger.info("Added repeatable job ".concat(job.name, " for queue ").concat(queue.name));
                                                            return [2 /*return*/];
                                                    }
                                                });
                                            }); }))];
                                    case 2:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); }))];
                case 1:
                    _a.sent();
                    _logger_service_1.logger.info("Repeatable jobs synchronized!");
                    // close out Redis connection
                    (0, _fastify_redis_1.getRedisClient)().disconnect();
                    return [2 /*return*/];
            }
        });
    });
}
exports.synchronizeRepeatableJobs = synchronizeRepeatableJobs;
