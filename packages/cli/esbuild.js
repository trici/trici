
const esbuild = require('esbuild');


async function build(args) {
    console.log("Building @trici/cli ...");
    console.log("args: ", args);
    esbuild.build({
        entryPoints: ['src/cli.ts'],
        bundle: true,
        outdir: 'dist',
        platform: 'node',
        sourcemap: true,
        target: 'node16',
        tsconfig: '../../tsconfig.json',
        // 'external': [
        //   '../../config/trici.config.js',
        // ],
    });
}

if (require.main === module) {
    build(process.argv.slice(2));
}

module.exports = build;
