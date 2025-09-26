import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import copy from 'rollup-plugin-copy';

const output = (format, options = {}) => ({
  dir: 'dist',
  format,
  entryFileNames: `p5.videoeditor.${format === 'umd' ? 'min.js' : 'esm.js'}`,
  name: 'p5.VideoEditor', // Required for UMD format
  sourcemap: true,
  globals: {
    p5: 'p5', // Treat p5 as an external global variable
  },
  ...options,
});

export default {
  input: 'src/p5.videoeditor.js',
  external: ['p5'], // p5.js is a peer dependency, so we exclude it from the bundle
  output: [
    output('umd', {
      plugins: [terser()], // Minify the UMD bundle
    }),
    output('esm'),
  ],
  plugins: [
    nodeResolve(),
    copy({
      targets: [
        {
          src: 'node_modules/gif.js/dist/gif.worker.js',
          dest: 'dist',
        },
      ],
    }),
  ],
};
