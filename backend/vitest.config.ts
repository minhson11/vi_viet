import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    root: import.meta.dirname,
    include: ['**/*.spec.ts'],
    exclude: ['**/*.e2e-spec.ts'],
    coverage: {
      include: ['src/**/*.ts'],
      exclude: [
        'src/main.ts',
        'src/**/*.module.ts',
        'src/**/dto/**',
        'src/**/*.spec.ts',
      ],
    },
  },
});
