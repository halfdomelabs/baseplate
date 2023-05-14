"use strict";
// @ts-nocheck
exports.__esModule = true;
exports.bullBoardModule = void 0;
var bull_board_1 = require("./plugins/bull-board");
require("./schema/authenticate.mutations");
exports.bullBoardModule = {
    plugins: [bull_board_1.bullBoardPlugin]
};
