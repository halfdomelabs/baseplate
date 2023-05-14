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
exports.useSentry = exports.defaultSkipError = void 0;
var core_1 = require("@envelop/core");
var Sentry = require("@sentry/node");
var graphql_1 = require("graphql");
var _http_errors_1 = require("%http-errors");
function defaultSkipError(error) {
    return error instanceof core_1.EnvelopError;
}
exports.defaultSkipError = defaultSkipError;
var sentryTracingSymbol = Symbol('sentryTracing');
var useSentry = function (options) {
    if (options === void 0) { options = {}; }
    function pick(key, defaultValue) {
        var _a;
        return (_a = options[key]) !== null && _a !== void 0 ? _a : defaultValue;
    }
    var startTransaction = pick('startTransaction', true);
    var trackResolvers = pick('trackResolvers', true);
    var includeResolverArgs = pick('includeResolverArgs', false);
    var includeRawResult = pick('includeRawResult', false);
    var includeExecuteVariables = pick('includeExecuteVariables', false);
    var renameTransaction = pick('renameTransaction', false);
    var skipOperation = pick('skip', function () { return false; });
    var skipError = pick('skipError', defaultSkipError);
    var trackRootResolversOnly = pick('trackRootResolversOnly', false);
    function addEventId(err, eventId) {
        var _a;
        var _b;
        if (options.eventIdKey === null) {
            return err;
        }
        var eventIdKey = (_b = options.eventIdKey) !== null && _b !== void 0 ? _b : 'sentryEventId';
        return new graphql_1.GraphQLError(err.message, err.nodes, err.source, err.positions, err.path, undefined, __assign(__assign({}, err.extensions), (_a = {}, _a[eventIdKey] = eventId, _a)));
    }
    var onResolverCalled = trackResolvers
        ? function (_a) {
            var resolversArgs = _a.args, info = _a.info, context = _a.context;
            var sentryTracingContext = context[sentryTracingSymbol];
            if (!sentryTracingContext) {
                return function () { };
            }
            var rootSpan = sentryTracingContext.rootSpan;
            if (rootSpan) {
                var fieldName = info.fieldName, returnType = info.returnType, parentType = info.parentType;
                if (trackRootResolversOnly &&
                    !['Query', 'Mutation', 'Subscription'].includes(parentType.name)) {
                    return function () { };
                }
                var parent_1 = rootSpan;
                var tags = {
                    fieldName: fieldName,
                    parentType: parentType.toString(),
                    returnType: returnType.toString()
                };
                if (includeResolverArgs) {
                    tags.args = JSON.stringify(resolversArgs || {});
                }
                var childSpan_1 = parent_1.startChild({
                    description: "".concat(parentType.name, ".").concat(fieldName),
                    op: 'db.graphql.yoga',
                    tags: tags
                });
                return function (_a) {
                    var result = _a.result;
                    if (includeRawResult) {
                        childSpan_1.setData('result', result);
                    }
                    childSpan_1.finish();
                };
            }
            return function () { };
        }
        : undefined;
    return {
        onResolverCalled: onResolverCalled,
        onExecute: function (_a) {
            var _b;
            var _c;
            var args = _a.args, extendContext = _a.extendContext;
            if (skipOperation(args)) {
                return {};
            }
            var rootOperation = args.document.definitions.find(function (o) { return o.kind === graphql_1.Kind.OPERATION_DEFINITION; });
            var operationType = rootOperation.operation;
            var document = (0, graphql_1.print)(args.document);
            var opName = args.operationName ||
                ((_c = rootOperation.name) === null || _c === void 0 ? void 0 : _c.value) ||
                'Anonymous Operation';
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            var addedTags = (options.appendTags && options.appendTags(args)) || {};
            var traceparentData = (options.traceparentData && options.traceparentData(args)) || {};
            var transactionName = options.transactionName
                ? options.transactionName(args)
                : opName;
            var op = options.operationName
                ? options.operationName(args)
                : 'db.graphql.yoga';
            var tags = __assign({ operationName: opName, operation: operationType }, addedTags);
            var rootSpan;
            if (startTransaction) {
                rootSpan = Sentry.startTransaction(__assign({ name: transactionName, description: 'execute', op: op, tags: tags }, traceparentData));
                if (!rootSpan) {
                    var error = [
                        "Could not create the root Sentry transaction for the GraphQL operation \"".concat(transactionName, "\"."),
                        "It's very likely that this is because you have not included the Sentry tracing SDK in your app's runtime before handling the request.",
                    ];
                    throw new Error(error.join('\n'));
                }
                // set current scope to rootSpan
                var scope = Sentry.getCurrentHub().getScope();
                scope === null || scope === void 0 ? void 0 : scope.setSpan(rootSpan);
            }
            else {
                var scope = Sentry.getCurrentHub().getScope();
                var parentSpan = scope === null || scope === void 0 ? void 0 : scope.getSpan();
                var span = parentSpan === null || parentSpan === void 0 ? void 0 : parentSpan.startChild({
                    description: transactionName,
                    op: op,
                    tags: tags
                });
                if (!span || !scope) {
                    // eslint-disable-next-line no-console
                    console.warn([
                        "Flag \"startTransaction\" is enabled but Sentry failed to find a transaction.",
                        "Try to create a transaction before GraphQL execution phase is started.",
                    ].join('\n'));
                    return {};
                }
                rootSpan = span;
                if (renameTransaction) {
                    scope.setTransactionName(transactionName);
                }
            }
            rootSpan.setData('document', document);
            if (options.configureScope) {
                Sentry.configureScope(function (scope) {
                    return options.configureScope && options.configureScope(args, scope);
                });
            }
            if (onResolverCalled) {
                var sentryContext = {
                    rootSpan: rootSpan,
                    opName: opName,
                    operationType: operationType
                };
                extendContext((_b = {}, _b[sentryTracingSymbol] = sentryContext, _b));
            }
            return {
                onExecuteDone: function (payload) {
                    var handleResult = function (_a) {
                        var result = _a.result, setResult = _a.setResult;
                        if (includeRawResult) {
                            rootSpan.setData('result', result);
                        }
                        if (result.errors && result.errors.length > 0) {
                            Sentry.withScope(function (scope) {
                                var _a;
                                scope.setTransactionName(opName);
                                scope.setTag('operation', operationType);
                                scope.setTag('operationName', opName);
                                scope.setExtra('document', document);
                                scope.setTags(addedTags || {});
                                if (includeRawResult) {
                                    scope.setExtra('result', result);
                                }
                                if (includeExecuteVariables) {
                                    scope.setExtra('variables', args.variableValues);
                                }
                                var errors = (_a = result.errors) === null || _a === void 0 ? void 0 : _a.map(function (err) {
                                    var _a, _b;
                                    if (skipError(err)) {
                                        return err;
                                    }
                                    if (err.originalError instanceof _http_errors_1.HttpError) {
                                        rootSpan.setHttpStatus(err.originalError.statusCode);
                                    }
                                    else {
                                        rootSpan.setStatus('unknown');
                                    }
                                    var errorPath = ((_a = err.path) !== null && _a !== void 0 ? _a : []).join(' > ');
                                    if (errorPath) {
                                        scope.addBreadcrumb({
                                            category: 'execution-path',
                                            message: errorPath,
                                            level: 'debug'
                                        });
                                    }
                                    // Map index values in list to $index for better grouping of events.
                                    var errorPathWithIndex = ((_b = err.path) !== null && _b !== void 0 ? _b : [])
                                        .map(function (v) { return (typeof v === 'number' ? '$index' : v); })
                                        .join(' > ');
                                    var eventId = Sentry.captureException(err, {
                                        fingerprint: [
                                            'graphql',
                                            errorPathWithIndex,
                                            opName,
                                            operationType,
                                        ],
                                        contexts: {
                                            GraphQL: {
                                                operationName: opName,
                                                operationType: operationType,
                                                variables: args.variableValues
                                            }
                                        }
                                    });
                                    return addEventId(err, eventId);
                                });
                                setResult(__assign(__assign({}, result), { errors: errors }));
                            });
                        }
                        else {
                            rootSpan.setStatus('ok');
                        }
                        rootSpan.finish();
                    };
                    return (0, core_1.handleStreamOrSingleExecutionResult)(payload, handleResult);
                }
            };
        }
    };
};
exports.useSentry = useSentry;
