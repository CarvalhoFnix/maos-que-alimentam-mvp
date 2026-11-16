import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['src/testing/setup.ts'],
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/app/db.ts', 'src/app/auth.service.ts', 'src/app/pages/**/*.ts'],
      reporter: ['text', 'text-summary']
    }
  },
  esbuild: { target: 'es2022' }
});
