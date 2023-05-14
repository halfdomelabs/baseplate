"use strict";
exports.__esModule = true;
exports.DateTimeScalar = void 0;
// @ts-nocheck
var graphql_1 = require("graphql");
var nexus_1 = require("nexus");
var _http_errors_1 = require("%http-errors");
exports.DateTimeScalar = (0, nexus_1.scalarType)({
    name: 'DateTime',
    asNexusMethod: 'dateTime',
    description: 'DateTime custom scalar type',
    sourceType: 'Date | string',
    parseValue: function (value) {
        if (typeof value === 'string') {
            return new Date(value);
        }
        throw new _http_errors_1.BadRequestError('DateTime field must be provided as a string');
    },
    serialize: function (value) {
        if (value instanceof Date) {
            return value.toISOString();
        }
        if (typeof value === 'string') {
            return new Date(value).toISOString();
        }
        throw new _http_errors_1.BadRequestError('DateTime field must be provided as a Date object or string');
    },
    parseLiteral: function (ast) {
        if (ast.kind === graphql_1.Kind.STRING) {
            return new Date(ast.value);
        }
        return null;
    }
});
