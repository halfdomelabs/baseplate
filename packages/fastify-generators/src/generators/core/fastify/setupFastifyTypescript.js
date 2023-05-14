"use strict";
exports.__esModule = true;
exports.setupFastifyTypescript = void 0;
function setupFastifyTypescript(node, typescriptConfig) {
    typescriptConfig.setTypescriptVersion('4.8.4');
    typescriptConfig.setTypescriptCompilerOptions({
        outDir: 'dist',
        declaration: true,
        baseUrl: './',
        paths: {
            '@src/*': ['./src/*']
        },
        target: 'ES2020',
        lib: ['ES2020'],
        esModuleInterop: true,
        module: 'commonjs',
        moduleResolution: 'node',
        strict: true,
        removeComments: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
        sourceMap: true
    });
    node.addDevPackages({
        'tsc-alias': '^1.5.0',
        'tsconfig-paths': '^3.12.0',
        'ts-node-dev': '^2.0.0',
        'ts-node': '^10.8.1'
    });
}
exports.setupFastifyTypescript = setupFastifyTypescript;
