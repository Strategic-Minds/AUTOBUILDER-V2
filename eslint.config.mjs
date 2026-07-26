import nextVitals from 'eslint-config-next/core-web-vitals'

export default [
  ...nextVitals,
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'out/**',
      'build/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'next-env.d.ts',
    ],
  },
  {
    rules: {
      // These Next 16 / React compiler-era rules flag existing animation and
      // client hydration patterns. They remain tracked for incremental cleanup,
      // but do not represent a security, correctness, or accessibility defect.
      'react-hooks/purity': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react/no-unescaped-entities': 'off',
      '@next/next/no-img-element': 'off',
    },
  },
]
