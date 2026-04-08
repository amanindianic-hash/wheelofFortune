import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/lib/**', 'src/components/widget/**', 'src/app/api/**'],
      exclude: ['src/__tests__/**'],
    },
    env: {
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test_db',
      JWT_SECRET: 'test-jwt-secret-at-least-32-chars-long!!',
      NEXTAUTH_SECRET: 'test-nextauth-secret',
    },
  },
  resolve: {
    // 'development' condition ensures React 19 loads its dev build in tests,
    // which keeps React.act available (stripped from the production bundle).
    conditions: ['development'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
