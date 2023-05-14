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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
exports.__esModule = true;
var core_1 = require("@pothos/core");
var string_1 = require("%ts-utils/string");
var rootBuilderProto = core_1.RootFieldBuilder.prototype;
rootBuilderProto.fieldWithInputPayload = function fieldWithInputPayload(_a) {
    var _this = this;
    var args = _a.args, input = _a.input, payload = _a.payload, fieldOptions = __rest(_a, ["args", "input", "payload"]);
    var inputRef = input && this.builder.inputRef("UnamedInputOn".concat(this.typename));
    var payloadRef = this.builder.objectRef("UnamedPayloadOn".concat(this.typename));
    // expose all fields of payload by default
    var payloadFields = function () {
        Object.keys(payload).forEach(function (key) {
            _this.builder.configStore.onFieldUse(payload[key], function (cfg) {
                if (cfg.kind === 'Object') {
                    // eslint-disable-next-line no-param-reassign
                    cfg.resolve = function (parent) {
                        return parent[key];
                    };
                }
            });
        });
        return payload;
    };
    var fieldRef = this.field(__assign({ args: __assign(__assign({}, args), (inputRef
            ? {
                input: this.arg({
                    required: true,
                    type: inputRef
                })
            }
            : {})), type: payloadRef, nullable: false }, fieldOptions));
    this.builder.configStore.onFieldUse(fieldRef, function (config) {
        var capitalizedName = (0, string_1.capitalizeString)(config.name);
        var inputName = "".concat(capitalizedName, "Input");
        var payloadName = "".concat(capitalizedName, "Payload");
        if (inputRef) {
            _this.builder.inputType(inputName, {
                description: "Input type for ".concat(config.name, " mutation"),
                fields: function () { return input; }
            });
            _this.builder.configStore.associateRefWithName(inputRef, inputName);
        }
        _this.builder.objectType(payloadRef, {
            name: payloadName,
            description: "Payload type for ".concat(config.name, " mutation"),
            fields: payloadFields
        });
        _this.builder.configStore.associateRefWithName(payloadRef, payloadName);
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return fieldRef;
};
Object.defineProperty(rootBuilderProto, 'input', {
    get: function getInputBuilder() {
        return new core_1.InputFieldBuilder(this.builder, 'InputObject', "UnnamedWithInputOn".concat(this.typename));
    }
});
Object.defineProperty(rootBuilderProto, 'payload', {
    get: function getPayloadBuilder() {
        return new core_1.ObjectFieldBuilder("UnnamedWithPayloadOn".concat(this.typename), this.builder);
    }
});
