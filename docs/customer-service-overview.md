# 고객서비스 현황

## 화면 및 권한

- 경로: `/customer-service-overview`
- 메뉴: 고객 서비스 > 고객서비스 현황
- 허용 역할: `ADMIN`
- 기존 열차 현황의 레이아웃, `AppDonutChart`, `AppDataGrid`, 날짜 표시 함수를 재사용한다.
- 일반 사용자와 열차 관리자는 메뉴에 표시하지 않으며 직접 URL/API 접근도 차단한다.

## API

`GET /api/v1/customer-service-overview`

공통 `ApiResponse`의 `data`에 다음 값을 반환한다.

| 필드 | 의미 |
| --- | --- |
| `complaintTotal`, `qnaTotal` | 민원·질문 전체 건수 |
| `complaintByStatus`, `qnaByStatus` | `PENDING`, `ANSWERED` 상태별 건수 |
| `pendingTotal`, `answeredTotal` | 두 서비스의 답변 대기·완료 합계 |
| `recentRequests` | 접수일·ID 내림차순으로 합친 최근 5건 |
| `fetchedAt` | 주입한 Clock으로 구한 조회 시각, ISO-8601 UTC |

최근 내역은 `id`, `serviceType`(`COMPLAINT`/`QNA`), `title`, `station`,
`status`(`PENDING`/`ANSWERED`), `createdAt`을 가진다.
같은 숫자 ID의 민원·질문도 별도로 유지한다. 내용 본문과 회원 개인정보는 집계 응답에 포함하지 않는다.
기존 감사 필드의 서울 기준 `LocalDateTime`을 API에서 UTC `Instant`로 변환하고 UI에서 서울 시각으로 표시한다.

## 구현

- 기능별 Service에서 상태별 count 및 DB 페이지로 제한한 최근 5건을 조회한다.
- 고객서비스 집계 Service는 기능별 공개 Service 계약을 호출한다.
- DB `REPEATABLE_READ` 트랜잭션에서 합계를 조회하고, 최대 10건만 합쳐 최종 5건을 반환한다.
- 기존 API URL·응답은 유지하고, 신규 URL에 `/api/v1` 규칙을 적용한다.
- 화면 함수는 `fn_`, 공통 함수는 기존 `gfn_` 함수를 사용하며 신규 Java import에 와일드카드를 사용하지 않는다.
- 추가 DB 테이블 또는 마이그레이션은 없다.

## 검증 범위

집계·빈 데이터·동일 ID·시간대·최근 건수 제한에 대한 단위 테스트,
관리자/사용자/열차관리자/비로그인의 API 권한 테스트,
프런트엔드의 메뉴·행 이동·새로고침 오류 상태 검사와 전체 빌드를 수행한다.
