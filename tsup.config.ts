import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: { entry: 'src/index.ts' },
  clean: true,
  sourcemap: true,
  treeshake: true,
})
