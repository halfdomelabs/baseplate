"use strict";
// @ts-nocheck
exports.__esModule = true;
var bull_1 = require("@src/services/bull");
var _error_logger_1 = require("%error-logger");
var REPEAT_JOB_CONFIGS = REPEAT_JOBS;
(0, bull_1.synchronizeRepeatableJobs)(REPEAT_JOB_CONFIGS)["catch"](function (err) {
    (0, _error_logger_1.logError)(err);
    process.exit(1);
});
