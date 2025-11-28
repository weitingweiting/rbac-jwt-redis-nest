const eslint = require('@eslint/js')
const tseslint = require('@typescript-eslint/eslint-plugin')
const tsparser = require('@typescript-eslint/parser')
const prettier = require('eslint-plugin-prettier')
const prettierConfig = require('eslint-config-prettier')

module.exports = [
  {
    // 全局忽略配置，避免不必要的检查
    ignores: ['dist', 'node_modules', '*.config.js', 'coverage', '**/*.test.ts', '**/*.spec.ts']
  },
  // TypeScript 文件配置
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
        sourceType: 'module'
      },
      globals: {
        node: true,
        jest: true,
        console: true,
        process: true,
        __dirname: true,
        module: true,
        require: true,
        exports: true
      }
    },
    plugins: {
      '@typescript-eslint': tseslint,
      prettier: prettier
    },
    rules: {
      ...eslint.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      ...prettierConfig.rules,

      // Prettier 规则（必须在最后，覆盖冲突的规则）
      'prettier/prettier': [
        'error',
        {
          singleQuote: true,
          trailingComma: 'none',
          semi: false,
          printWidth: 100,
          tabWidth: 2,
          endOfLine: 'lf',
          arrowParens: 'always'
        }
      ],

      // TypeScript 相关规则（宽松配置）
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'interface',
          format: ['PascalCase'],
          prefix: ['I']
        }
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_'
        }
      ],
      '@typescript-eslint/no-empty-function': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/interface-name-prefix': 'off',

      // 通用规则
      'no-console': 'off',
      'no-debugger': 'warn',
      'no-undef': 'off',
      'no-prototype-builtins': 'warn'
    }
  },
  // JavaScript 文件配置（不需要 TypeScript 解析器）
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        node: true,
        console: true,
        process: true,
        __dirname: true,
        module: true,
        require: true,
        exports: true
      }
    },
    plugins: {
      prettier: prettier
    },
    rules: {
      ...eslint.configs.recommended.rules,
      ...prettierConfig.rules,

      'no-console': 'off', // 允许 console
      'no-debugger': 'warn', // 调试语句警告
      'prettier/prettier': 'error' // Prettier 格式错误作为 ESLint 错误
    }
  }
]
