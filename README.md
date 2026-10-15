# vue

## 화면과 공통 레이아웃

화면 경로는 `src/plugins/router/routes.js`에서 관리합니다. 각 경로는 공통 레이아웃의 자식으로 등록하고, 화면 컴포넌트에는 내용만 작성합니다.

| 경로 | 레이아웃 | 화면 파일 |
| --- | --- | --- |
| `/`, `/dashboard`, `/profile`, `/forbidden` | `src/layouts/dtro.vue` | `src/pages/` |
| `/trains` 및 하위 경로 | `src/layouts/dtro.vue` | `src/features/train/views/` |
| `/login`, `/register` | `src/layouts/dtro-auth.vue` | `src/pages/` |

새 화면은 화면 파일을 만든 뒤 `routes.js`의 해당 레이아웃 `children`에 등록합니다. 헤더와 사이드 메뉴는 레이아웃이 렌더링하므로 화면에서 `DtroAppShell`이나 `DtroAuthShell`로 감싸지 않습니다.

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=johnsoncodehk.volar) (and disable Vetur).

## Type Support for `.vue` Imports in TS

Since TypeScript cannot handle type information for `.vue` imports, they are shimmed to be a generic Vue component type by default. In most cases this is fine if you don't really care about component prop types outside of templates.

However, if you wish to get actual prop types in `.vue` imports (for example to get props validation when using manual `h(...)` calls), you can run `Volar: Switch TS Plugin on/off` from VS Code command palette.

## Customize configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```
