"use strict";
exports.__esModule = true;
exports.config = void 0;
// @ts-nocheck
var zod_1 = require("zod");
var configSchema = zod_1.z.object(CONFIG_OBJECT);
exports.config = configSchema.parse(process.env);
ADDITIONAL_VERIFICATIONS;
