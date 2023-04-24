const esbuild = require('esbuild');


async function build(args) {
    console.log("Building @trici/pm ...");
    console.log("args: ", args);
    esbuild.build({
        entryPoints: ['src/index.ts'],
        bundle: true,
        outfile: 'dist/index.js',
        platform: 'node',
        sourcemap: true,
        target: 'node16',
    });
}

if (require.main === module) {
    build(process.argv.slice(2));
}

module.exports = build;
