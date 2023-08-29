
const esbuild = require('esbuild');

const isProdBuild = process.env.NODE_ENV === 'production';

async function build(args) {
    console.log("Building @trici/utils ...");
    console.log("args: ", args);
    esbuild.build({
        entryPoints: ['src/index.ts'],
        bundle: true,
        outdir: 'dist',
        platform: 'node',
        sourcemap: !isProdBuild,
        minify: isProdBuild,
        target: 'node16',
        tsconfig: 'tsconfig.json',
    });
}

if (require.main === module) {
    build(process.argv.slice(2));
}

module.exports = build;
