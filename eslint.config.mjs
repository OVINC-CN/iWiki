import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';

export default [
  {
    ignores: ['dist/', 'public/', 'node_modules/'],
  },
  js.configs.recommended,
  ...pluginVue.configs['flat/strongly-recommended'],
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
        defineProps: 'readonly',
        defineEmits: 'readonly',
        process: 'readonly',
        COS: 'readonly',
      },
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      'max-len': 'off',
    },
  },
];
