# Contract: Archify workflow 원본과 standalone 산출물

**Date**: 2026-09-09

## 파일 계약

```text
apps/front/diagrams/hotel-reservation-platform/
└── platform-change-verification-deployment.json

apps/front/public/diagrams/hotel-reservation-platform/
└── platform-change-verification-deployment.html
```

- JSON은 검토·재생성 가능한 의미 원본이다.
- HTML은 Archify `deliver`가 frozen JSON에서 생성한 self-contained 공개 산출물이다.
- 앱 build와 runtime은 Archify 설치, generation command 또는 외부 네트워크에 의존하지 않는다.
- delivered HTML은 직접 수정하지 않는다.

## 의미 parity 계약

Feature 010의 `HOTEL_RESERVATION_PLATFORM_DETAIL.swimlanes[0]`이 canonical source다.

- project slug: `hotel-reservation-platform`
- swimlane id: `platform-change-verification-deployment`
- node: 정확히 10개
- edge: 정확히 12개
- 기존 step label·description과 각 edge 방향·조건 의미를 보존한다.
- canonical 4개 lane은 Archify의 3개 presentation band로 다음과 같이 명시적으로 대응한다.
  - `요구사항` → `요구사항`
  - `기준 코드` + `플랫폼 확장` → `코드 경계`; 세부 ownership은 `core`, `rsConfig`, `platform` node label로 보존
  - `검증·배포` → `검증·배포`
- 세 코드 배치는 동등한 분기다.
  - 모든 플랫폼 공통 → `core`
  - 값만 다름 → `rsConfig`
  - 화면·로직 차이 → `platform`
- 정상 경로는 플랫폼별 빌드와 계약·동작 검증 뒤 호텔별 운영 폴더 배포로 끝난다.
- 예외 경로는 패리티 누락 뒤 운영 브랜치 감사, `core·platform` 수동 이식과 재검증으로 돌아간다.
- 새 기술 구성요소, 자동화, 수치, 운영 성과나 단일 산출물 배포를 추가하지 않는다.

## Archify authoring 계약

- type은 `workflow`, `schema_version`은 `2`다.
- `meta.quality_profile`은 `showcase`다.
- `meta.visual_preset`, `meta.subtitle`, `meta.animation`, `meta.engineering_profile`을 지정하지 않는다.
- 한국어 authored content를 유지하고 코드 identifier는 원문 표기를 보존한다.
- 지원하지 않는 한국어 locale을 설정하지 않으며 fixed Viewer UI와 HTML language는 영어 fallback임을 검증 기록에 남긴다.
- 첫 candidate는 자동 route와 label을 사용한다.
- validator diagnostic이 특정한 경우에만 supported geometry control을 한 번에 하나 적용한다.
- 의미 있는 edge label은 geometry 수정을 위해 삭제하지 않는다.
- 필수 component type은 실제 React 플랫폼 코드 작업 범위만 나타내도록 모든 node에 `frontend`를 사용한다. `backend`, `security`, `cloud` 같은 추가 시스템 의미를 도입하지 않는다.
- node ID·label·sublabel·presentation band와 edge ID·source·target·label은 JSON을 파싱한 exact comparison으로 검증한다.

## 생성 순서 계약

1. workflow schema v2, common schema, workflow example 하나만 읽는다.
2. candidate JSON을 먼저 작성한다.
3. 첫 candidate 뒤 packaged update checker를 한 번 실행한다.
4. 매 candidate 수정 직후 showcase validation을 실행한다.
5. artifact check 9/9, composition error 0, warning 0일 때 source를 동결한다.
6. frozen source로 `deliver`를 한 번 성공시켜 HTML과 receipt를 만든다.
7. delivered HTML에 `visual-check`를 실행한다.
8. screenshot을 직접 열어 지각 품질을 별도로 검토한다.

두 차례 집중 수정에도 objective error의 최저치가 개선되지 않으면 해결되지 않은 diagnostic을 보고하고 사용자 판단 게이트에서 멈춘다.

## 증거 계약

`verification.md`에는 다음을 서로 구분해 기록한다.

- showcase validate: 9개 artifact check와 composition error/warning 수
- deliver: command exit, specification SHA-256·byte count, artifact SHA-256·byte count
- visual-check: 검사한 viewport와 overflow·runtime 결과
- Playwright: public HTTP 200, 새 탭 URL, keyboard, 원본 UI·다른 스윔레인 회귀
- perceptual review: node 관통, edge 충돌, label 잘림·겹침, 주·분기·복구 경로 오독 여부

delivery 실패 뒤 기존 last-good HTML에 visual-check를 실행해 새 candidate가 통과했다고 기록하지 않는다.

## 공개·보안 계약

- 고객 정보, 예약·결제 식별자, 인증 정보, secret, private source/log, 내부 감사 수치를 JSON·HTML·screenshot·receipt에 넣지 않는다.
- 결과물은 인증 없는 same-origin 정적 문서로만 제공한다.
- 프로젝트 본문과 연결 인사이트 copy는 artifact 생성 과정에서 수정하지 않는다.
