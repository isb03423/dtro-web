# DTRO Web

도시철도 운영 정보와 고객 서비스를 제공하는 DTRO의 Vue 프론트엔드입니다. 백엔드는 별도 저장소인 [dtro-service](https://github.com/isb03423/dtro-service)에서 제공합니다.

## 목차

1. [프로젝트 소개](#프로젝트-소개)
2. [주요 기능](#주요-기능)
3. [프로젝트 구조](#프로젝트-구조)
4. [실행 전 준비](#실행-전-준비)
5. [1단계: 소스코드 다운로드](#1단계-소스코드-다운로드)
6. [2단계: 프론트엔드 실행](#2단계-프론트엔드-실행)
7. [프로덕션 빌드](#프로덕션-빌드)
8. [자주 발생하는 오류](#자주-발생하는-오류)

## 프로젝트 소개

- **기술 스택:** Vue 3, JavaScript, Vite 5, Vuetify 3, Pinia, Vue Router
- **API 연결:** 브라우저의 `/api` 요청을 Vite 개발 서버가 백엔드로 전달
- **백엔드:** [dtro-service](https://github.com/isb03423/dtro-service) (Spring Boot, PostgreSQL)

## 주요 기능

- 열차 현황, 열차 정보, 운행 정보, 운행 장애 조회 및 관리
- 공지사항, 자료실, Q&A, 민원과 고객 서비스 현황
- 회원가입, 로그인, 프로필 관리 및 관리자 회원 관리
- 로그인 상태와 역할에 따른 화면 접근 제어

화면 경로와 접근 역할은 [`src/plugins/router/routes.js`](src/plugins/router/routes.js)에서 확인할 수 있습니다.

## 프로젝트 구조

```text
src/
├─ api/                 # 공통 HTTP 요청과 인증 API
├─ assets/              # 이미지와 공통 스타일
├─ components/          # 공통 UI와 DTRO 레이아웃 부품
├─ composables/         # 화면 간 재사용하는 상태와 동작
├─ features/            # 열차, 장애, 민원, Q&A 등 기능별 화면과 API
├─ layouts/             # 일반 화면과 인증 화면의 레이아웃
├─ pages/               # 홈, 로그인, 회원 정보 등 페이지
├─ plugins/router/      # 라우터 및 화면 경로
├─ stores/              # Pinia 인증 상태
└─ utils/               # 공통 유틸리티
```

## 실행 전 준비

1. Git과 Node.js를 설치합니다. Node.js는 [`.nvmrc`](.nvmrc)에 맞춰 LTS 버전을 사용합니다. npm은 Node.js에 포함됩니다.
2. 터미널에서 `git --version`, `node --version`, `npm --version`으로 설치를 확인합니다.
3. API를 사용하려면 [서비스 실행 안내](https://github.com/isb03423/dtro-service#readme)에 따라 백엔드를 먼저 실행합니다. 현재 개발 설정의 백엔드 포트는 `8080`입니다.

## 1단계: 소스코드 다운로드

```bash
git clone https://github.com/isb03423/dtro-web.git
cd dtro-web
```

이미 저장소가 있다면 해당 디렉터리에서 다음 명령을 실행합니다.

## 2단계: 프론트엔드 실행

```bash
npm ci
npm run dev
```

개발 서버가 출력한 주소를 브라우저에서 엽니다. 기본 주소는 `http://localhost:5173`입니다. `npm ci`는 `package-lock.json`을 기준으로 의존성을 설치하고, 설치 후 Iconify 아이콘 CSS를 생성합니다.

[`vite.config.js`](vite.config.js)는 `/api`를 `http://127.0.0.1:8080`으로 프록시합니다. 백엔드 포트를 바꾸면 이 주소도 함께 맞춰야 합니다.

## 프로덕션 빌드

```bash
npm run build
npm run preview
```

빌드 결과는 `dist/`에 생성됩니다. `preview`는 로컬 확인용이며 현재 설정에서는 `http://localhost:5050`을 사용합니다. 배포 시에는 `/api`를 백엔드로 전달하도록 웹 서버 또는 프록시를 별도로 설정해야 합니다. Vite 개발 프록시는 빌드 결과에 포함되지 않습니다.

## 자주 발생하는 오류

| 증상 | 확인할 내용 |
| --- | --- |
| API 요청 실패 또는 `ECONNREFUSED` | 백엔드 실행 여부와 `vite.config.js`의 프록시 주소가 서비스 포트 `8080`과 일치하는지 확인합니다. |
| `npm ci` 실패 | Node.js LTS와 npm 버전, 저장소 루트에서 실행했는지 확인합니다. |
| 아이콘이 보이지 않음 | `npm run build:icons`로 Iconify CSS를 다시 생성합니다. |
| 401/403 응답 | 로그인 상태와 계정 역할을 확인합니다. 일부 화면은 관리자 또는 열차 운영자만 접근할 수 있습니다. |
| 빌드 화면에서 API를 찾지 못함 | 배포 서버에서 `/api` 역방향 프록시를 설정했는지 확인합니다. |
