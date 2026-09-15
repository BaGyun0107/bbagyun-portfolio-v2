# Portfolio Content Authoring and Insight Contract

**Date**: 2026-08-25

이 문서는 project-local authoring skill과 frontend가 함께 지켜야 하는 관찰 가능한
계약을 정의한다. 세부 타입은 [data-model.md](../data-model.md)를 따른다.

## 1. Authoring entry contract

작업물·공부 기록·인사이트의 작성, 수정, 이전, 사실 정정, 검토 요청은 모두
`portfolio-content-authoring` skill의 적용 대상이다.

절차는 다음 순서를 지킨다.

1. 인터뷰와 feature 기록을 확인한다.
2. 변경 대상과 연결된 작업물·공부 기록·인사이트를 찾는다.
3. 글의 역할과 인사이트 유형을 판정한다.
4. 출처 연결 또는 허용 가능한 독립 사유를 검증한다.
5. 공통 의미와 유형별 의미가 존재하는지 검토한다.
6. 역할·수치·시점·원인·대안·결과를 연결 기록과 대조한다.
7. 시각 자료 필요성을 판정하고 이유를 남긴다.
8. 장문·시각 자료 중복과 공개 양방향 탐색을 검증한다.

같은 Markdown 제목이나 고정된 인사이트 수는 이 계약이 아니다.

## 2. Source precedence contract

충돌 시 우선순위는 다음과 같다.

1. 승인된 인터뷰 기록
2. 해당 `specs/<NNN-feature>/`의 확정 사실과 verification
3. 프로젝트 콘텐츠 작성 규칙과 skill
4. 기존 공개 본문

외부 기술·가격 정보는 공식 primary source를 우선하고 기준 시점을 기록한다.
현재 자료로 과거 구현 사실을 새로 만들지 않는다.

## 3. Insight type contract

### Project case

- 실제 작업물에서 출발한 하나의 질문
- 유효한 작업물 하나가 필수
- 당시 역할, 문제·시점, 제약, 실제 선택·구현, 결과 근거, 한계·회고 제공
- 독립 유지 이유로 source requirement 우회 금지

### Technical exploration

- 공부·실험에서 출발한 하나의 질문
- 유효한 공부 기록 연결이 원칙
- 참고와 직접 실험, 개념·대안, 적용/비적용 조건, 한계·추가 검증 제공
- source가 없는 기존 글만 명시적 독립 유지 이유 허용

## 4. Visual evidence contract

모든 이전 완료 인사이트는 `not-needed`, `recommended`, `provided` 중 하나와
구체적인 이유를 갖는다.

- 세 주체 이상의 상호작용, 정상/실패/복구, 관계와 소유권, 세 대안 이상,
  시간 변화가 핵심이면 적합한 visual kind를 우선 검토한다.
- 단순한 순차 설명이나 기존 표로 충분하면 `not-needed`가 유효하다.
- `recommended`는 그림을 추측해 즉시 만들라는 뜻이 아니다.
- `provided`는 답할 질문, text alternative, 중복하지 않는 이유가 필수다.
- 연결 작업물의 전체 그림을 인사이트에 그대로 복제하지 않는다.

## 5. Public rendering contract

- editorial metadata가 있는 인사이트 목록과 상세은 승인된 한국어 type label을
  표시한다.
- 상세은 실제 source가 있을 때만 작업물 또는 공부 기록 link를 표시한다.
- source 화면은 연결 인사이트를 다시 탐색할 수 있다.
- legacy 글은 비어 있는 type/source placeholder 없이 현재처럼 렌더링한다.
- 기존 `/projects/:slug`, `/study/:slug`, `/insights/:slug` 경로는 유지한다.
- 320/768/1024/1440px에서 문서 전체 가로 overflow가 없어야 한다.

## 6. Incremental migration contract

현재 집합은 [data-model.md](../data-model.md)의 정확한 8개다. 프로젝트 사례형 7개와
기술 탐구형 1개는 metadata가 필수이며, 나머지 10개에는 이번 feature에서 metadata나
본문 재작성을 강제하지 않는다. `logging-decoupling-and-buffering-in-external-api-systems`는
`the-siena-golf-reservation`에서 나온 2026-08-26 사용자 승인 후속이다. 초기 7개/11개
fixture는 당시 RED·실행 증거로 보존하되 현재 migration contract로 사용하지 않는다.
route 삭제, 통합, 비공개 전환은 별도 사용자 승인 없이는 수행하지 않는다.

## 7. Verification contract

완료에는 다음 증거가 모두 필요하다.

- 6개 skill eval의 without-skill/with-skill 결과
- 8개 migrated fixture(프로젝트 사례형 7개, 기술 탐구형 1개)의 유형·출처·visual 판정 검증
- 존재하지 않는 source link 0건
- target source와 insight의 확정 사실 충돌 0건
- legacy 10개 본문·route 보존
- changed-file lint, typecheck, Vitest, production build
- 별도 포트 production E2E와 responsive overflow 확인
