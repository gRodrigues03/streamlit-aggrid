const esbuild = require('esbuild');
const { copy } = require('esbuild-plugin-copy');

esbuild.build({
    entryPoints: ['src/index.tsx'],
    bundle: true,
    minify: true,
    outfile: 'dist/bundle.js',
    define: { 'process.env.NODE_ENV': '"production"' },
    platform: 'browser',
}).catch(() => process.exit(1));