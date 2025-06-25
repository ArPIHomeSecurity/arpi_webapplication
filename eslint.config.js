const js = require('@eslint/js');
const tseslint = require('@typescript-eslint/eslint-plugin');
const tsparser = require('@typescript-eslint/parser');
const angular = require('@angular-eslint/eslint-plugin');
const angularTemplate = require('@angular-eslint/eslint-plugin-template');
const angularParser = require('@angular-eslint/template-parser');
const importPlugin = require('eslint-plugin-import');
const jsdocPlugin = require('eslint-plugin-jsdoc');
const preferArrowPlugin = require('eslint-plugin-prefer-arrow');
const prettierPlugin = require('eslint-plugin-prettier');

module.exports = [
    {
        // Global ignores
        ignores: [
            'dist*/**',
            'node_modules/**',
            'coverage/**',
            '**/*.d.ts',
            'android/**',
            'capacitor-app/**',
            'e2e/**',
            'resources/**',
            'scripts/**',
            '*.config.js',
            '*.config.ts'
        ]
    },
    {
        // Configuration for TypeScript files
        files: ['**/*.ts'],
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                ecmaVersion: 2022,
                sourceType: 'module',
                project: './tsconfig.json'
            }
        },
        plugins: {
            '@typescript-eslint': tseslint,
            '@angular-eslint': angular,
            'import': importPlugin,
            'jsdoc': jsdocPlugin,
            'prefer-arrow': preferArrowPlugin,
            'prettier': prettierPlugin
        },
        rules: {
            // Base ESLint rules
            ...js.configs.recommended.rules,

            // TypeScript ESLint rules
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/no-inferrable-types': 'error',

            // Angular ESLint rules - only basic ones that exist
            '@angular-eslint/directive-selector': [
                'error',
                {
                    type: 'attribute',
                    prefix: 'app',
                    style: 'camelCase'
                }
            ],
            '@angular-eslint/component-selector': [
                'error',
                {
                    type: 'element',
                    prefix: 'app',
                    style: 'kebab-case'
                }
            ],
            '@angular-eslint/no-empty-lifecycle-method': 'error',
            '@angular-eslint/use-lifecycle-interface': 'error',

            // Import rules
            'import/no-unresolved': 'off',
            'import/order': [
                'error',
                {
                    groups: [
                        'builtin',
                        'external',
                        'internal',
                        'parent',
                        'sibling',
                        'index'
                    ],
                    'newlines-between': 'always'
                }
            ],

            // JSDoc rules
            'jsdoc/check-alignment': 'error',
            'jsdoc/check-indentation': 'error',

            // Prefer arrow functions
            'prefer-arrow/prefer-arrow-functions': [
                'warn',
                {
                    disallowPrototype: true,
                    singleReturnOnly: false,
                    classPropertiesAllowed: false
                }
            ],

            // General rules
            'no-console': 'warn',
            'no-debugger': 'error',
            'no-var': 'error',
            'prefer-const': 'error',

            // Prettier integration
            'prettier/prettier': 'error'
        }
    },
    {
        // Configuration for HTML template files - minimal safe rules
        files: ['**/*.html'],
        languageOptions: {
            parser: angularParser
        },
        plugins: {
            '@angular-eslint/template': angularTemplate
        },
        rules: {
            // Only basic template rules that definitely exist
            '@angular-eslint/template/banana-in-box': 'error',
            '@angular-eslint/template/no-negated-async': 'error'
        }
    }
];
