import js from '@eslint/js'
import stylistic from '@stylistic/eslint-plugin'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import eslintPluginImport from 'eslint-plugin-import'
import eslintPluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfigWithVueTs(
  // Base configurations
  js.configs.recommended,
  ...eslintPluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,

  // Global ignores
  {
    ignores: ['node_modules', 'dist', 'out', '**/node_modules/**', '**/dist/**']
  },

  // Main configuration
  {
    plugins: {
      '@stylistic': stylistic,
      import: eslintPluginImport
    },

    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },

    rules: {
      // Stylistic rules
      '@stylistic/semi': ['warn', 'never'],
      '@stylistic/quotes': ['warn', 'single'],
      '@stylistic/comma-dangle': ['warn', 'never'],
      '@stylistic/arrow-parens': ['warn', 'as-needed'],
      '@stylistic/indent': ['warn', 2],
      '@stylistic/max-len': ['warn', { code: 200 }],
      '@stylistic/eol-last': ['warn', 'always'],
      '@stylistic/linebreak-style': ['warn', 'unix'],

      // Vue specific rules
      'vue/require-default-prop': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/comma-dangle': ['warn', 'never'],

      // TypeScript rules
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_'
        }
      ],
      '@typescript-eslint/no-explicit-any': 'warn',

      // Import ordering rules
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', ['sibling', 'parent'], 'index', 'object'],
          pathGroups: [
            { pattern: 'vue', group: 'external', position: 'before' },
            { pattern: 'pinia', group: 'external', position: 'after' },
            { pattern: '@/**', group: 'internal', position: 'after' }
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
          alphabetize: {
            order: 'asc',
            caseInsensitive: true
          }
        }
      ],

      // Sort imports within groups
      'sort-imports': [
        'warn',
        {
          ignoreDeclarationSort: true,
          ignoreMemberSort: false
        }
      ]
    }
  },

  // Vue files specific configuration
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: ['.vue'],
        sourceType: 'module'
      }
    }
  }
)
