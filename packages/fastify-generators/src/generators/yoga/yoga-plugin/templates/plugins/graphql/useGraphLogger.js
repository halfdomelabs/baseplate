"use strict";
// @ts-nocheck
exports.__esModule = true;
exports.useGraphLogger = void 0;
var perf_hooks_1 = require("perf_hooks");
var core_1 = require("@envelop/core");
var graphql_1 = require("graphql");
var _logger_service_1 = require("%logger-service");
function getOperationType(document) {
    var operationDefinition = document.definitions.find(function (d) { return d.kind === graphql_1.Kind.OPERATION_DEFINITION; });
    return operationDefinition === null || operationDefinition === void 0 ? void 0 : operationDefinition.operation;
}
var useGraphLogger = function (options) {
    var logSubscriptionExecution = (options || {}).logSubscriptionExecution;
    function logResult(_a, startTime) {
        var args = _a.args, result = _a.result;
        var operationType = getOperationType(args.document);
        var endTime = perf_hooks_1.performance.now();
        var errors = result.errors || [];
        errors.forEach(function (error) { return _logger_service_1.logger.error(error.originalError || error); });
        if (operationType !== 'subscription' || logSubscriptionExecution) {
            _logger_service_1.logger.info({
                operationType: operationType,
                operationName: args.operationName,
                executionTime: startTime && endTime - startTime,
                success: !(errors === null || errors === void 0 ? void 0 : errors.length)
            }, "executed graphql ".concat(operationType || 'query', " (").concat(args.operationName || 'Anonymous Operation', ")"));
        }
    }
    return {
        // Log parser errors
        onParse: function () {
            return function (_a) {
                var result = _a.result;
                if (result instanceof Error) {
                    _logger_service_1.logger.error(result);
                }
            };
        },
        // Log validation errors
        onValidate: function () {
            return function (_a) {
                var result = _a.result, valid = _a.valid;
                if (!valid) {
                    result.forEach(function (error) { return _logger_service_1.logger.error(error.message); });
                }
            };
        },
        onExecute: function (_a) {
            var args = _a.args;
            var startTime = perf_hooks_1.performance.now();
            return {
                onExecuteDone: function (payload) {
                    return (0, core_1.handleStreamOrSingleExecutionResult)(payload, function (p) {
                        return logResult(p, startTime);
                    });
                }
            };
        },
        onSubscribe: function (_a) {
            var args = _a.args;
            _logger_service_1.logger.info({ operationName: args.operationName }, "graphql subscription started (".concat(args.operationName || 'Anonymous Operation', ")"));
            return {
                onSubscribeResult: function (payload) {
                    return (0, core_1.handleStreamOrSingleExecutionResult)(payload, function (p) {
                        return logResult(p);
                    });
                },
                onSubscribeError: function (_a) {
                    var error = _a.error;
                    _logger_service_1.logger.error(error);
                }
            };
        }
    };
};
exports.useGraphLogger = useGraphLogger;
