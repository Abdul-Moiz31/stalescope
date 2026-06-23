import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'dashboard/handler': 'src/dashboard/handler.ts',
  },
  format: ['cjs', 'esm'],
  dts: { entry: { index: 'src/index.ts', 'dashboard/handler': 'src/dashboard/handler.ts' } },
  clean: true,
  sourcemap: true,
  treeshake: true,
})
