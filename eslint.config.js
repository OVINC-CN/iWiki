import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import google from 'eslint-config-google';
import globals from 'globals';

export default [
  {
    ignores: ['dist/**', 'public/**', 'node_modules/**'],
  },
  js.configs.recommended,
  google,
  ...pluginVue.configs['flat/strongly-recommended'],
  {
    files: ['**/*.{js,mjs,cjs,vue}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
        defineProps: 'readonly',
        defineEmits: 'readonly',
        defineExpose: 'readonly',
        withDefaults: 'readonly',
        COS: 'readonly',
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      'max-len': 'off',
      'new-cap': 'off',
      'require-jsdoc': 'off',
      'valid-jsdoc': 'off',
    },
  },
];
