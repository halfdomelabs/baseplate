"use strict";
exports.__esModule = true;
exports.PothosTypeReferenceContainer = exports.safeMerge = exports.getExpressionFromPothosTypeReference = void 0;
var core_generators_1 = require("@baseplate/core-generators");
var R = require("ramda");
var scalars_1 = require("./scalars");
function getExpressionFromPothosTypeReference(ref) {
    return core_generators_1.TypescriptCodeUtils.createExpression(ref.exportName, "import { ".concat(ref.exportName, " } from '").concat(ref.moduleName, "';"));
}
exports.getExpressionFromPothosTypeReference = getExpressionFromPothosTypeReference;
// TODO: Make immutable / freezable
function safeMerge(itemOne, itemTwo) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return R.mergeWithKey(function (key) {
        throw new Error("Cannot merge key ".concat(key, " because it already exists."));
    })(itemOne, itemTwo);
}
exports.safeMerge = safeMerge;
var PothosTypeReferenceContainer = /** @class */ (function () {
    function PothosTypeReferenceContainer(customScalars, pothosEnums, inputTypes, objectTypes) {
        if (customScalars === void 0) { customScalars = {}; }
        if (pothosEnums === void 0) { pothosEnums = {}; }
        if (inputTypes === void 0) { inputTypes = {}; }
        if (objectTypes === void 0) { objectTypes = {}; }
        this.customScalars = customScalars;
        this.pothosEnums = pothosEnums;
        this.inputTypes = inputTypes;
        this.objectTypes = objectTypes;
    }
    PothosTypeReferenceContainer.prototype.addCustomScalar = function (config) {
        if (this.customScalars[config.scalar]) {
            throw new Error("Custom scalar ".concat(config.scalar, " already has been added to PothosTypeReferenceContainer"));
        }
        this.customScalars[config.scalar] = config;
    };
    PothosTypeReferenceContainer.prototype.addPothosEnum = function (config) {
        if (this.pothosEnums[config.typeName]) {
            throw new Error("Enum ".concat(config.typeName, " already has been added to PothosTypeReferenceContainer"));
        }
        this.pothosEnums[config.typeName] = config;
    };
    PothosTypeReferenceContainer.prototype.addInputType = function (config) {
        if (this.inputTypes[config.typeName]) {
            throw new Error("Input type ".concat(config.typeName, " already has been added to PothosTypeReferenceContainer"));
        }
        this.inputTypes[config.typeName] = config;
    };
    PothosTypeReferenceContainer.prototype.addObjectType = function (config) {
        if (this.objectTypes[config.typeName]) {
            throw new Error("Object type ".concat(config.typeName, " already has been added to PothosTypeReferenceContainer"));
        }
        this.objectTypes[config.typeName] = config;
    };
    PothosTypeReferenceContainer.prototype.cloneWithObjectType = function (config) {
        var _a;
        return new PothosTypeReferenceContainer(this.customScalars, this.pothosEnums, this.inputTypes, safeMerge(this.objectTypes, (_a = {}, _a[config.typeName] = config, _a)));
    };
    PothosTypeReferenceContainer.prototype.getScalar = function (name) {
        var scalar = this.customScalars[name];
        if (!scalar) {
            return scalars_1.INBUILT_POTHOS_SCALARS[name];
        }
        return scalar;
    };
    PothosTypeReferenceContainer.prototype.getEnum = function (name) {
        var pothosEnum = this.pothosEnums[name];
        if (!pothosEnum) {
            throw new Error("Could not find Pothos enum ".concat(name));
        }
        return pothosEnum;
    };
    PothosTypeReferenceContainer.prototype.getInputType = function (name) {
        var inputType = this.inputTypes[name];
        return inputType;
    };
    PothosTypeReferenceContainer.prototype.getObjectType = function (name) {
        var objectType = this.objectTypes[name];
        return objectType;
    };
    PothosTypeReferenceContainer.prototype.getCustomScalars = function () {
        return Object.values(this.customScalars);
    };
    PothosTypeReferenceContainer.prototype.merge = function (other) {
        return new PothosTypeReferenceContainer(safeMerge(this.customScalars, other.customScalars), safeMerge(this.pothosEnums, other.pothosEnums), safeMerge(this.inputTypes, other.inputTypes), safeMerge(this.objectTypes, other.objectTypes));
    };
    return PothosTypeReferenceContainer;
}());
exports.PothosTypeReferenceContainer = PothosTypeReferenceContainer;
