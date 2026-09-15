# Archify 스윔레인 파일럿 설계

**작성일**: 2026-09-09
**대상 작업물**: `hotel-reservation-platform`
**대상 스윔레인**: `platform-change-verification-deployment`
**상태**: 사용자 설계 승인 완료, 문서 검토 대기

## 1. 목적

호텔 예약 시스템 작업물의 기존 React 스윔레인을 보존하면서, 동일한 흐름을 Archify `workflow`로 제작해 standalone interactive viewer의 표현 품질과 활용 가치를 검증한다.

이 파일럿은 스윔레인의 사실이나 정보 구조를 다시 설계하는 작업이 아니다. Feature 010에서 승인·검증된 노드, 관계, 패리티 복구 경로를 다른 렌더링 방식으로 표현하고 기존 화면과 직접 비교하는 작업이다.

## 2. 성공 조건

- 기존 React 미리보기와 `크게 보기` Dialog가 바뀌지 않는다.
- 호텔 예약 시스템의 대상 스윔레인에만 `Archify로 보기` 링크가 표시된다.
- 링크는 같은 출처의 standalone HTML을 새 탭으로 연다.
- Archify 결과는 기존 10개 노드, 12개 관계와 패리티 복구 의미를 유지한다.
- Archify showcase validation, delivery, browser evidence와 육안 검토가 모두 통과한다.
- Archify 도구가 없는 런타임과 CI에서도 기존 Next.js 앱과 생성된 HTML이 정상 제공된다.
- 파일럿이 만족스러울 때만 작은 미리보기까지 전환하는 후속 설계를 별도로 진행한다.

## 3. 범위

### 포함

- 기존 `FeatureSwimlane`에 선택적 Archify 링크 metadata 추가
- 호텔 예약 시스템 스윔레인 하나의 Archify workflow JSON 작성
- 검증된 standalone HTML 생성 및 정적 제공
- 스윔레인 카드에 조건부 `Archify로 보기` 새 탭 링크 추가
- DTO, 렌더링, 파일 존재, HTTP 응답, 키보드와 회귀 검사 추가
- Archify validate, deliver, visual-check와 이미지 기반 시각 검토 증거 기록

### 제외

- 기존 React 스윔레인 미리보기 또는 Dialog 제거
- 기존 스윔레인의 전체 Archify 전환
- 다른 작업물이나 인사이트의 시각 자료 변경
- 노드·관계·문구·성과의 재해석 또는 추가
- iframe 내장, build-time Archify 생성, animation 적용
- 한국어 Viewer UI 구현 또는 Archify renderer 수정

## 4. 현재 구조와 선택 이유

현재 포트폴리오는 `FeatureSwimlane`의 lane, step, edge, exception 데이터를 React SVG renderer에 전달한다. 반응형 미리보기와 Dialog는 같은 데이터를 사용하며, 노드 관통·라벨 겹침·문서 overflow를 자체 테스트한다.

Archify는 typed JSON을 입력받아 테마 전환, 확대·이동, 검색, 관계 추적과 내보내기를 지원하는 self-contained HTML을 생성한다. 이 HTML을 React Dialog에 iframe으로 중첩하면 두 viewer의 UI와 focus 경계가 겹친다. Next.js build에서 Archify를 실행하면 사용자 로컬 skill 설치 상태가 CI와 런타임 의존성으로 번진다.

따라서 파일럿은 JSON과 생성 HTML을 함께 버전 관리하고, 기존 카드에서 같은 출처의 HTML을 새 탭으로 여는 방식을 사용한다. 포트폴리오 런타임은 정적 HTML만 제공하며 Archify 실행 환경을 요구하지 않는다.

## 5. 데이터와 파일 경계

### FeatureSwimlane 확장

```ts
interface FeatureSwimlane {
  // 기존 필드 유지
  archify?: {
    url: string;
    label: string;
  };
}
```

- `archify`는 선택 필드다.
- `url`은 `/diagrams/` 아래의 `.html` same-origin 경로만 허용한다.
- `label`은 사용자에게 보이는 링크 이름이며 비어 있을 수 없다.
- 파일럿에서는 `Archify로 보기`를 사용한다.
- metadata가 없는 스윔레인에는 링크나 빈 placeholder를 만들지 않는다.

### 파일 배치

```text
apps/front/
├── diagrams/
│   └── hotel-reservation-platform/
│       └── platform-change-verification-deployment.json
└── public/diagrams/
    └── hotel-reservation-platform/
        └── platform-change-verification-deployment.html
```

- JSON은 사람이 수정하고 검토할 수 있는 의미 구조의 원본이다.
- HTML은 Archify `deliver`가 JSON을 고정해 생성한 배포 산출물이다.
- JSON과 HTML의 hash 및 byte receipt를 검증 기록에 남긴다.
- 생성 후 JSON을 수정해야 하면 기존 HTML을 직접 고치지 않고 validate와 deliver를 다시 수행한다.

## 6. 화면 동작

스윔레인 카드 header에는 기존 동작과 새 동작을 함께 표시한다.

```text
[크게 보기] [Archify로 보기 ↗]
```

- `크게 보기`는 기존 React SVG Dialog를 연다.
- `Archify로 보기`는 standalone HTML을 새 탭에서 연다.
- 링크는 `target="_blank"`와 `rel="noopener noreferrer"`를 사용한다.
- 접근 가능한 이름은 스윔레인 제목과 새 탭 동작을 함께 전달한다.
- 좁은 화면에서는 두 action이 줄바꿈되더라도 제목이나 본문을 가리지 않아야 한다.
- 작성 콘텐츠는 한국어지만 Archify가 한국어 locale을 지원하지 않으므로 Viewer 고정 UI와 문서 언어 fallback은 영어다. 노드·관계·설명은 한국어를 유지한다.

## 7. Archify workflow 의미 계약

새 workflow이므로 `schema_version: 2`를 사용하고 `meta.quality_profile`은 `showcase`로 설정한다. `meta.visual_preset`, `meta.subtitle`, `meta.animation`, `meta.engineering_profile`은 지정하지 않는다.

기존 의미 구조는 다음과 같다.

```text
변경 요청
  → 차이 분류
      ├─ 모든 플랫폼 공통 → core에 공통 동작 배치
      ├─ 값만 다름 → rsConfig에 값 배치
      └─ 화면·로직 차이 → platform에 화면·로직 배치
  → 플랫폼별 빌드
  → 계약·동작 검증
      ├─ 검증 통과 → 호텔별 운영 폴더 배포
      └─ 패리티 누락 → 운영 브랜치 감사
                       → core·platform 수동 이식
                       → 계약·동작 재검증
```

작성 규칙은 다음과 같다.

- 기존 10개 step의 안정적인 ID와 한국어 의미를 가능한 한 유지한다.
- 기존 12개 edge의 방향과 label을 보존한다.
- 세 코드 배치 경로는 우선순위가 아니라 동등한 분기다.
- 패리티 누락은 운영 배포 전 발견한 recoverable 경로다.
- 새 수치, 시스템 구성요소, 자동화 또는 운영 성과를 추가하지 않는다.
- 한 개의 명확한 주 경로와 가까운 분기·복구 경로로 구성한다.
- 최초 candidate는 자동 route와 label만 사용한다.
- validator가 지적할 때만 지원된 geometry control을 한 번에 하나씩 적용한다.
- 의미 있는 edge label을 geometry 문제 해결을 위해 삭제하지 않는다.

## 8. 생성과 검증 흐름

1. Archify의 workflow schema v2, common schema와 workflow 예제 하나만 읽는다.
2. 새 stable ID와 승인된 도메인 문구로 candidate JSON을 작성한다.
3. candidate 작성 직후 update checker를 한 번 실행한다.
4. 다음 명령으로 매 수정 후 검증한다.

   ```bash
   node bin/archify.mjs validate workflow <candidate.json> --quality showcase --json
   ```

5. showcase acceptance는 9개 artifact check, composition error 0건, warning 0건을 요구한다.
6. geometry 진단이 필요하면 layout receipt를 읽고 진단 대상 하나만 수정한다.
7. 최종 validation 통과 뒤 candidate를 동결한다.
8. `deliver`로 same-directory snapshot과 public HTML을 생성하고 receipt를 기록한다.
9. delivered HTML을 `visual-check`로 검사한다.
10. 생성된 screenshot을 직접 확인해 노드 관통, 관계 충돌, 라벨 잘림, 복구 경로 오독을 판정한다.

`validate`, `deliver`, `visual-check`, 육안 검토는 서로 다른 증거다. 어느 하나도 다른 검사를 대신하지 않는다.

## 9. 실패 처리

- candidate validation이 실패하면 HTML을 연결하지 않는다.
- 두 번의 집중 수정에도 objective error 최저치가 개선되지 않으면 진단과 미해결 상태를 보고하고 중단한다.
- `deliver`가 실패하면 이전 last-good HTML을 새 결과처럼 검사하거나 공개하지 않는다.
- `visual-check`가 실패하면 deterministic delivery 성공과 브라우저 검증 실패를 구분해 기록한다.
- 생성 HTML이 없거나 metadata URL과 일치하지 않으면 자동 검사가 실패한다.
- Archify 자료가 실패하거나 제거되더라도 기존 React 미리보기와 Dialog는 계속 동작한다.
- 외부 URL, 빈 label, `/diagrams/` 밖의 경로와 `.html`이 아닌 경로는 DTO validation에서 거부한다.

## 10. 테스트 전략

### RED/GREEN 단위 검사

- `FeatureSwimlane.archify` 선택 필드와 유효 경로 계약
- 빈 label, 외부 URL, 잘못된 root와 확장자 거부
- 대상 HTML 파일 존재 여부
- metadata가 있을 때만 새 링크 렌더링
- 기존 `크게 보기` Dialog와 React SVG 유지
- 새 링크의 보이는 이름, accessible name, target과 rel
- 다른 모든 스윔레인에 Archify 링크가 생기지 않음

### 브라우저 검사

- 호텔 예약 시스템 상세에서 기존 미리보기와 두 action이 함께 표시됨
- `Archify로 보기`를 키보드로 활성화하면 새 page가 열림
- standalone HTML이 HTTP 200으로 응답함
- 320, 768, 1024, 1440px에서 카드 action과 기존 본문에 document overflow가 없음
- 기존 React `크게 보기` Dialog의 focus와 Escape 복귀가 유지됨
- 다른 구조화 작업물의 스윔레인 카드에는 새 action이 없음

### Archify 증거

- showcase validate receipt
- deliver specification/artifact SHA-256과 byte count
- visual-check viewport evidence
- 실제 screenshot의 이미지 기반 검토 결과

## 11. 출시와 후속 판단

파일럿 결과가 승인되기 전에는 기존 작은 미리보기를 Archify 기반으로 바꾸지 않는다. 사용자는 기존 React 미리보기·Dialog와 새 standalone viewer를 직접 비교한다.

후속 B 전환은 별도 설계에서 다음을 다시 결정한다.

- 작은 미리보기에 static SVG/export를 사용할지
- standalone viewer와 미리보기의 단일 source를 어떻게 보장할지
- 기존 React renderer와 geometry test를 제거할지 유지할지
- 모든 작업물을 한 번에 옮길지 점진적으로 옮길지

파일럿 성공은 Archify가 기존 renderer를 즉시 대체한다는 의미가 아니다. 표현 품질, 유지보수성, 접근성과 검증 비용을 함께 비교한 뒤 후속 전환 여부를 결정한다.

## 12. 확정된 결정

- 호텔 예약 시스템의 기존 스윔레인 1개로 파일럿한다.
- 기존 작은 미리보기와 React `크게 보기`를 유지한다.
- 별도 `Archify로 보기` action으로 standalone viewer를 새 탭에서 연다.
- 기존 노드·관계·복구 경로만 옮기고 본문이나 회고를 추가하지 않는다.
- Archify JSON과 delivered HTML을 함께 저장한다.
- build-time generation, iframe, animation은 사용하지 않는다.
- 파일럿이 만족스러울 때만 작은 미리보기 전환을 별도로 검토한다.
