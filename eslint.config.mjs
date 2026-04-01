import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    files: ['src/backend/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-namespace': 'off',
    },
  },
  {
    files: ['src/components/**/*.{ts,tsx}', 'src/hooks/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    ignores: [
      '.next/**',
      'out/**',
      'build/**',
      'dist/**',
      'node_modules/**',
      'next-env.d.ts',
      'src/backend/email/examples/**/*',
      'src/backend/email/services/email-service-orchestrator.ts',
      'src/backend/email/services/multi-provider.service.ts',
    ],
  },
];

export default eslintConfig;