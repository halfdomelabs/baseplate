"use strict";
// @ts-nocheck
exports.__esModule = true;
exports.stripe = void 0;
var stripe_1 = require("stripe");
var _config_1 = require("%config");
exports.stripe = new stripe_1["default"](_config_1.config.STRIPE_SECRET_KEY, {
    apiVersion: '2020-08-27'
});
