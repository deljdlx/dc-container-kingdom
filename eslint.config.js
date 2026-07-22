import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: {
        window: 'readonly',
        document: 'readonly',
        fetch: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        requestAnimationFrame: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      // Classes are shared as globals via ordered <script> tags until the
      // ES-module migration (stage 3); cross-file references are resolved at
      // runtime, not statically. Control chars are intentional ANSI stripping.
      'no-undef': 'off',
      'no-control-regex': 'off',
    },
  },
  {
    files: ['mock/**/*.js', 'vite.config.js', 'test/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        process: 'readonly',
        console: 'readonly',
        Response: 'readonly',
        URL: 'readonly',
        fetch: 'readonly',
      },
    },
  },
];
