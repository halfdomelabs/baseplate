"use strict";
exports.__esModule = true;
exports.missingTypePlugin = void 0;
// @ts-nocheck
var nexus_1 = require("nexus");
/**
 * Nexus doesn't have a good error message when a type is missing
 * (Error: NEXUS__UNKNOWN__TYPE was already defined and imported as a type, check the docs for extending types)
 *
 * Therefore, this plugin makes it more explicit what type is missing
 */
exports.missingTypePlugin = (0, nexus_1.plugin)({
    name: 'missingTypePlugin',
    onMissingType: function (typeName, builder) {
        throw new Error("GraphQL schema is missing type ".concat(typeName));
    }
});
