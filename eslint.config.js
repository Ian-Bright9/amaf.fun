import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-plugin-prettier';
import globals from 'globals';

export default [
	js.configs.recommended,
	...tseslint.configs.recommended,
	...svelte.configs['flat/recommended'],
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parserOptions: {
				parser: tseslint.parser
			}
		}
	},
	{
		plugins: {
			prettier
		},
		rules: {
			'prettier/prettier': 'error',
			'no-console': 'warn',
			'no-debugger': 'warn',
			'no-duplicate-imports': 'error',
			'@typescript-eslint/no-unused-vars': 'off',
			'@typescript-eslint/no-explicit-any': 'warn',
			'svelte/no-navigation-without-resolve': 'off'
		},
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
				...globals.es2017
			}
		}
	},
	{
		ignores: [
			'**/*.config.js',
			'**/*.config.ts',
			'.svelte-kit/**',
			'build/**',
			'dist/**',
			'node_modules/**'
		]
	}
];
