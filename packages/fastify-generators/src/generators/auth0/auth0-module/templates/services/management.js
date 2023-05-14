"use strict";
// @ts-nocheck
exports.__esModule = true;
exports.getAuth0ManagementClient = void 0;
var auth0_1 = require("auth0");
var _config_1 = require("%config");
var cachedClient = null;
function getAuth0ManagementClient() {
    if (cachedClient) {
        return cachedClient;
    }
    var client = new auth0_1.ManagementClient({
        domain: _config_1.config.AUTH0_TENANT_DOMAIN,
        clientId: _config_1.config.AUTH0_CLIENT_ID,
        clientSecret: _config_1.config.AUTH0_CLIENT_SECRET
    });
    cachedClient = client;
    return client;
}
exports.getAuth0ManagementClient = getAuth0ManagementClient;
