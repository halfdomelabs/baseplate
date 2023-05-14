"use strict";
// @ts-nocheck
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
exports.createStandardMutation = void 0;
var nexus_1 = require("nexus");
var string_1 = require("%ts-utils/string");
/**
 * Creates a standard mutation with the following structure
 * mutation(input: MutationInput): MutationPayload
 *
 * @param options Options for the mutation
 * @returns An array with the created types
 */
function createStandardMutation(_a) {
    var name = _a.name, inputDefinition = _a.inputDefinition, payloadDefinition = _a.payloadDefinition, resolve = _a.resolve;
    var inputName = "".concat((0, string_1.capitalizeString)(name), "Input");
    var inputType = inputDefinition &&
        (0, nexus_1.inputObjectType)({
            name: inputName,
            description: "Input type for ".concat(name, " mutation"),
            definition: inputDefinition
        });
    var payloadName = "".concat((0, string_1.capitalizeString)(name), "Payload");
    var payloadType = (0, nexus_1.objectType)({
        name: payloadName,
        description: "Payload type for ".concat(name, " mutation"),
        definition: payloadDefinition
    });
    var mutationType = (0, nexus_1.mutationField)(function (t) {
        t.field(name, {
            args: inputType
                ? {
                    input: (0, nexus_1.arg)({ type: (0, nexus_1.nonNull)(inputType) })
                }
                : {},
            type: (0, nexus_1.nonNull)(payloadType),
            resolve: resolve
        });
    });
    return __spreadArray(__spreadArray([], (inputType ? [inputType] : []), true), [payloadType, mutationType], false);
}
exports.createStandardMutation = createStandardMutation;
