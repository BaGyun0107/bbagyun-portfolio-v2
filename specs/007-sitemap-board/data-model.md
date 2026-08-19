# Data Model: 007-sitemap-board

## Sitemap (`data/sitemap.json`)

사람이 소유하는 확정 산출물. 생성물 아님.

| 필드 | 타입 | 규칙 |
|---|---|---|
| `version` | number | 필수, 현재 `1` |
| `surfaces` | Surface[] | 필수, key 중복 금지 |

## Surface

| 필드 | 타입 | 규칙 |
|---|---|---|
| `key` | string | 필수, `user\|admin\|common` 3종 표준 |
| `title` | string | 필수 (예: 사용자 앱, 관리자/운영, 공통/시스템) |
| `nodes` | Node[] | 필수(빈 배열 허용) |

## Node

| 필드 | 타입 | 규칙 |
|---|---|---|
| `id` | string | 필수, 전체 사이트맵에서 유일. 행 `Area` 매칭 키 |
| `title` | string | 필수 |
| `description` | string | 선택 |
| `aliases` | string[] | 선택, 전역에서 id/타 alias와 충돌 시 경고 + 선선언 우선 |
| `children` | Node[] | 선택, 재귀(깊이 제한 없음, 실사용 2~3단) |

## Feature Row (기존 — 변경 없음)

`feature-definition-schema.json`의 canonical row. 매칭 입력은
`rowArea(row)`(기존 헬퍼, `Area` 기반). **새 필드 추가 금지.**

## 매핑 결과 (빌드 시 계산, 저장 안 함)

| 개념 | 정의 |
|---|---|
| 배치 행 | `trim(Area)`가 어떤 노드 `id` 또는 `aliases`와 정확 일치 |
| 미배치 버킷 | 어떤 노드와도 불일치한 행의 집합. 트리 최하단 표시 |
| 0건 노드 | 배치 행이 없는 노드. 회색 표시, 제거하지 않음 |
| 파생 트리 | 사이트맵 부재 시 `sitemapGroups()` 기반 user/admin 2그룹 |

## 상태 전이

없음 — 사이트맵은 상태 기계가 아니라 구조 문서. 갱신은 사람이 파일을
고치는 행위이며, 행과의 불일치는 빌드 힌트가 보고한다.
