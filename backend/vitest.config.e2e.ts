import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    root: import.meta.dirname,
    include: ['**/*.e2e-spec.ts'],
    setupFiles: ['./test/setup/e2e-env.ts'],
    fileParallelism: false,
    testTimeout: 60000,
    hookTimeout: 60000,
  },
});
