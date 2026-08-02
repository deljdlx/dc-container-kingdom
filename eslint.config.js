import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    ignores: ['dist/**', 'node_modules/**', 'dc-container-kingdom.worktrees/**'],
  },
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        fetch: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        performance: 'readonly',
        requestAnimationFrame: 'readonly',
        TextEncoder: 'readonly',
        crypto: 'readonly',
        Image: 'readonly',
        getComputedStyle: 'readonly',
        HTMLElement: 'readonly',
        URLSearchParams: 'readonly',
        KeyboardEvent: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      // Control chars are intentional ANSI stripping in LogEntry.
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
        window: 'readonly',
        document: 'readonly',
        KeyboardEvent: 'readonly',
        PointerEvent: 'readonly',
        WheelEvent: 'readonly',
      },
    },
  },
];
