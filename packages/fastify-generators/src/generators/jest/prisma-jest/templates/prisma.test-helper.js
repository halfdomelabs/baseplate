"use strict";
// @ts-nocheck
exports.__esModule = true;
exports.prismaMock = void 0;
var jest_mock_extended_1 = require("jest-mock-extended");
var _prisma_service_1 = require("%prisma-service");
jest.mock('PRISMA_SERVICE_PATH', function () { return ({
    __esModule: true,
    prisma: (0, jest_mock_extended_1.mockDeep)()
}); });
exports.prismaMock = _prisma_service_1.prisma;
beforeEach(function () {
    (0, jest_mock_extended_1.mockReset)(exports.prismaMock);
    // mock $transaction
    exports.prismaMock.$transaction.mockImplementation(function (promises) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return typeof promises === 'function'
            ? promises(exports.prismaMock)
            : Promise.all(promises);
    });
});
