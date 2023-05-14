"use strict";
exports.__esModule = true;
exports.DateScalar = void 0;
// @ts-nocheck
var graphql_1 = require("graphql");
var _pothos_1 = require("%pothos");
var _http_errors_1 = require("%http-errors");
var DATE_REGEX = /^[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}$/;
function parseDateString(value) {
    // timezones can be very wonky so we expect only a simple YYYY-MM-DD string
    if (!DATE_REGEX.test(value)) {
        throw new _http_errors_1.BadRequestError('Date field must be provided as a string with format YYYY-MM-DD');
    }
    // this ensures that we will always be using UTC timezone
    return new Date("".concat(value, "T00:00:00.000Z"));
}
function formatDateString(value) {
    return value.toISOString().split('T')[0];
}
exports.DateScalar = _pothos_1.builder.scalarType('Date', {
    description: 'Date custom scalar type',
    parseValue: function (value) {
        if (typeof value === 'string') {
            return parseDateString(value);
        }
        throw new _http_errors_1.BadRequestError('Date field must be provided as a string');
    },
    serialize: function (value) {
        if (value instanceof Date) {
            return formatDateString(value);
        }
        if (typeof value === 'string') {
            return formatDateString(new Date(value));
        }
        throw new _http_errors_1.BadRequestError('DateTime field must be provided as a Date object or string');
    },
    parseLiteral: function (ast) {
        if (ast.kind === graphql_1.Kind.STRING) {
            return parseDateString(ast.value);
        }
        throw new _http_errors_1.BadRequestError('Date field must be provided as a string');
    }
});
