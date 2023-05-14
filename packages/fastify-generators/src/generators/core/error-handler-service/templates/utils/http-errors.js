"use strict";
// do not need a file for each class
/* eslint-disable max-classes-per-file */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
exports.InternalServerError = exports.NotFoundError = exports.ForbiddenError = exports.UnauthorizedError = exports.BadRequestError = exports.HttpError = void 0;
var HttpError = /** @class */ (function (_super) {
    __extends(HttpError, _super);
    function HttpError(message, code, extraData, statusCode) {
        if (statusCode === void 0) { statusCode = 500; }
        var _this = _super.call(this, message) || this;
        _this.code = code;
        _this.extraData = extraData;
        _this.statusCode = statusCode;
        return _this;
    }
    return HttpError;
}(Error));
exports.HttpError = HttpError;
var BadRequestError = /** @class */ (function (_super) {
    __extends(BadRequestError, _super);
    function BadRequestError(message, code, extraData) {
        if (code === void 0) { code = 'BAD_REQUEST'; }
        return _super.call(this, message, code, extraData, 400) || this;
    }
    return BadRequestError;
}(HttpError));
exports.BadRequestError = BadRequestError;
var UnauthorizedError = /** @class */ (function (_super) {
    __extends(UnauthorizedError, _super);
    function UnauthorizedError(message, code, extraData) {
        if (code === void 0) { code = 'UNAUTHORIZED'; }
        return _super.call(this, message, code, extraData, 401) || this;
    }
    return UnauthorizedError;
}(HttpError));
exports.UnauthorizedError = UnauthorizedError;
var ForbiddenError = /** @class */ (function (_super) {
    __extends(ForbiddenError, _super);
    function ForbiddenError(message, code, extraData) {
        if (code === void 0) { code = 'FORBIDDEN'; }
        return _super.call(this, message, code, extraData, 403) || this;
    }
    return ForbiddenError;
}(HttpError));
exports.ForbiddenError = ForbiddenError;
var NotFoundError = /** @class */ (function (_super) {
    __extends(NotFoundError, _super);
    function NotFoundError(message, code, extraData) {
        if (code === void 0) { code = 'NOT_FOUND'; }
        return _super.call(this, message, code, extraData, 404) || this;
    }
    return NotFoundError;
}(HttpError));
exports.NotFoundError = NotFoundError;
var InternalServerError = /** @class */ (function (_super) {
    __extends(InternalServerError, _super);
    function InternalServerError(message, code, extraData) {
        if (code === void 0) { code = 'INTERNAL_SERVER_ERROR'; }
        return _super.call(this, message, code, extraData, 500) || this;
    }
    return InternalServerError;
}(HttpError));
exports.InternalServerError = InternalServerError;
