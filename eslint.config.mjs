import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import importPlugin from 'eslint-plugin-import';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Next.js의 기존(Legacy) 설정을 Flat Config에서 사용하기 위한 호환성 객체
const compat = new FlatCompat({
  baseDirectory: __dirname
});

const eslintConfig = [
  // 1. Next.js 및 TypeScript 기본 권장 설정 가져오기
  ...compat.extends('next/core-web-vitals', 'next/typescript'),

  // 2. Prettier 설정 (포매팅 충돌 방지 및 규칙 강제)
  eslintPluginPrettierRecommended,

  // 3. 커스텀 플러그인 및 팀 컨벤션 규칙 (설계적 관점 반영)
  {
    plugins: {
      import: importPlugin
    },
    rules: {
      // 사용하지 않는 변수 경고 (인터페이스 설계 시 '_' 시작 변수 허용)
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

      // any 타입 사용 경고 (엄격한 타입 설계)
      '@typescript-eslint/no-explicit-any': 'warn',

      // Import 순서 강제 (의존성 파악을 위한 아키텍처적 장치)
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', ['parent', 'sibling'], 'index', 'object', 'type'],
          pathGroups: [
            {
              pattern: '{react,react-dom/**,next,next/**}',
              group: 'builtin',
              position: 'before'
            },
            {
              pattern: '@/**',
              group: 'internal',
              position: 'after'
            }
          ],
          pathGroupsExcludedImportTypes: ['react'],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true
          }
        }
      ]
    }
  }
];

export default eslintConfig;
