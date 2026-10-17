
module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    '.eslintrc-auto-import.json',
    'plugin:vue/vue3-recommended',
    'plugin:import/recommended',
    'plugin:promise/recommended',
    'plugin:sonarjs/recommended',
    'plugin:case-police/recommended',
    'plugin:regexp/recommended',

    // 'plugin:unicorn/recommended',
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    ecmaVersion: 13,
    sourceType: 'module',
  },
  plugins: [
    'vue',
    'regex',
    'regexp',
  ],

  // ESLint 검사에서 제외할 파일 및 폴더
  ignorePatterns: ['src/plugins/iconify/*.js', 'node_modules', 'dist', '*.d.ts', 'vendor', '*.json'],

  rules: {
    // 실행문이 한 줄이어도 조건문·반복문에는 항상 중괄호를 사용한다.
    'curly': ['error', 'all'],
    'brace-style': ['error', '1tbs'],

    // 개발 환경에서는 콘솔 출력 및 디버거 사용 허용
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',

    // 쉼표 및 객체 속성의 공백 규칙
    'comma-spacing': ['error', { before: false, after: true }],
    'key-spacing': ['error', { afterColon: true }],

    // Node.js 전역 process 사용 방식 검사 비활성화
    'n/prefer-global/process': ['off'],

    // 함수의 인지적 복잡도 검사 비활성화
    'sonarjs/cognitive-complexity': ['off'],

    // Vue 속성이 한 줄 또는 여러 줄일 때 줄바꿈 방식 지정
    'vue/first-attribute-linebreak': ['error', {
      singleline: 'beside',
      multiline: 'below',
    }],

    // 들여쓰기는 공백 2칸 사용
    'indent': ['error', 2],

    // 여러 줄로 작성된 배열 및 객체 등의 마지막 요소 쉼표 강제 경고 비활성화
    'comma-dangle': 'off',

    // 객체 중괄호 내부에 공백 사용
    'object-curly-spacing': ['error', 'always'],

    // camelCase 명명 규칙 경고 비활성화 (gfn_getLabel 등 접두사_함수명 허용)
    'camelcase': 'off',

    // 코드 한 줄의 최대 길이 제한 비활성화
    'max-len': 'off',

    // 세미콜론 사용 금지
    'semi': ['error', 'never'],

    // 화살표 함수의 매개변수 괄호는 필요한 경우에만 사용
    'arrow-parens': ['error', 'as-needed'],

    // return 문 앞에 빈 줄 추가
    'newline-before-return': 'error',

    // 주석 앞뒤의 빈 줄 규칙
    'lines-around-comment': [
      'error',
      {
        beforeBlockComment: true,
        beforeLineComment: true,
        allowBlockStart: true,
        allowClassStart: true,
        allowObjectStart: true,
        allowArrayStart: true,

        // SECTION 종료 주석 앞에는 불필요한 빈 줄을 추가하지 않음
        ignorePattern: '!SECTION',
      },
    ],

    // 사용하지 않는 변수의 _ 처리 관련 주석 (별도 규칙 미설정)

    // 배열 요소의 줄바꿈 방식 통일
    'array-element-newline': ['error', 'consistent'],
    'array-bracket-newline': ['error', 'consistent'],

    // Vue 컴포넌트 이름에 여러 단어를 사용하도록 강제하는 규칙 비활성화
    'vue/multi-word-component-names': 'off',

    // <input/>, <div></div> 등 self-closing 관련 경고 비활성화
    'vue/html-self-closing': 'off',

    // 한 줄에 속성이 여러 개일 때 줄바꿈 강제 경고 비활성화
    'vue/max-attributes-per-line': 'off',

    // 요소 내용 앞뒤 줄바꿈 강제 경고 비활성화 (<button>텍스트</button> 등)
    'vue/singleline-html-element-content-newline': 'off',
    'vue/multiline-html-element-content-newline': 'off',

    // 특정 구문 사이에 빈 줄 추가
    'padding-line-between-statements': [
      'error',
      { blankLine: 'always', prev: 'expression', next: 'const' },
      { blankLine: 'always', prev: 'const', next: 'expression' },
      { blankLine: 'always', prev: 'multiline-const', next: '*' },
      { blankLine: 'always', prev: '*', next: 'multiline-const' },
    ],

    // import 플러그인 관련 규칙
    'import/prefer-default-export': 'off',
    'import/newline-after-import': ['error', { count: 1 }],
    'no-restricted-imports': ['error', 'vuetify/components', {
      name: 'vue3-apexcharts',
      message: 'apexcharts are auto imported',
    }],

    // JS 및 TS 파일을 import할 때 확장자 생략 허용
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        jsx: 'never',
        ts: 'never',
        tsx: 'never',
      },
    ],

    // 가상 모듈 및 특수 import 경로는 경로 검사에서 제외
    'import/no-unresolved': [2, {
      ignore: [
        '~pages$',
        'virtual:generated-layouts',
        '#auth$',
        '#components$',

        // Vite의 ?raw import 경로 검사 제외
        '.*\\?raw',
      ],
    }],

    // 참고: https://stackoverflow.com/a/63961972/10796681
    'no-shadow': 'off',

    // Promise 플러그인 관련 규칙
    'promise/always-return': 'off',
    'promise/catch-or-return': 'off',

    // Vue 플러그인 관련 규칙
    'vue/block-tag-newline': 'error',
    'vue/component-api-style': 'error',
    'vue/component-name-in-template-casing': ['error', 'PascalCase', { registeredComponentsOnly: false, ignores: ['/^swiper-/'] }],
    'vue/custom-event-name-casing': ['error', 'camelCase', {
      ignores: [
        '/^(click):[a-z]+((\\d)|([A-Z0-9][a-z0-9]+))*([A-Z])?/',
      ],
    }],
    'vue/define-macros-order': 'error',
    'vue/html-comment-content-newline': 'error',
    'vue/html-comment-content-spacing': 'error',
    'vue/html-comment-indent': 'error',
    'vue/match-component-file-name': 'error',
    'vue/no-child-content': 'error',
    'vue/require-default-prop': 'off',

    'vue/no-duplicate-attr-inheritance': 'error',
    'vue/no-empty-component-block': 'error',
    'vue/no-multiple-objects-in-class': 'error',
    'vue/no-reserved-component-names': 'error',
    'vue/no-template-target-blank': 'error',
    'vue/no-useless-mustaches': 'error',
    'vue/no-useless-v-bind': 'error',
    'vue/padding-line-between-blocks': 'error',
    'vue/prefer-separate-static-class': 'error',
    'vue/prefer-true-attribute-shorthand': 'error',
    'vue/v-on-function-call': 'error',
    'vue/no-restricted-class': ['error', '/^(p|m)(l|r)-/'],
    'vue/valid-v-slot': ['error', {
      allowModifiers: true,
    }],

    // Vue 확장 규칙
    'vue/no-irregular-whitespace': 'error',
    'vue/template-curly-spacing': 'error',

    // SonarLint 관련 규칙
    'sonarjs/no-duplicate-string': 'off',
    'sonarjs/no-nested-template-literals': 'off',

    // Unicorn 플러그인 관련 규칙 (현재 비활성화)
    // 'unicorn/filename-case': 'off',
    // 'unicorn/prevent-abbreviations': ['error', {
    //   replacements: {
    //     props: false,
    //   },
    // }],

    // 프로젝트 내부 사용자 정의 규칙

    // 참고: https://github.com/gmullerb/eslint-plugin-regex
    'regex/invalid': [
      'error',
      [
        {
          regex: '@/assets/images',
          replacement: '@images',
          message: 'Use \'@images\' path alias for image imports',
        },
        {
          regex: '@/assets/styles',
          replacement: '@styles',
          message: 'Use \'@styles\' path alias for importing styles from \'src/assets/styles\'',
        },

        {
          id: 'Disallow icon of icon library',
          regex: 'tabler-\\w',
          message: 'Only \'mdi\' icons are allowed',
        },

        {
          regex: '@core/\\w',
          message: 'You can\'t use @core when you are in @layouts module',
          files: {
            inspect: '@layouts/.*',
          },
        },
        {
          regex: 'useLayouts\\(',
          message: '`useLayouts` composable is only allowed in @layouts & @core directory. Please use `useThemeConfig` composable instead.',
          files: {
            inspect: '^(?!.*(@core|@layouts)).*',
          },
        },
      ],

      // ESLint 설정 파일은 정규식 검사에서 제외
      '\\.eslintrc\\.cjs',
    ],
  },

  // import 경로 확인을 위한 모듈 해석 설정
  settings: {
    'import/resolver': {
      node: true,
      typescript: { project: './jsconfig.json' },
    },
  },
}
