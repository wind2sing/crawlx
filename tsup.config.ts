import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: false,
  target: 'node16',
  outDir: 'dist',
  external: ['cheerio', 'undici'],
  treeshake: true,
  bundle: true,
  platform: 'node',
});
