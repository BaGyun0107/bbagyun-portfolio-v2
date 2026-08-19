# Feature Specification: 그누보드5 PHP 쇼핑몰 프로젝트 하네스 지원

**Feature Branch**: `feat/gnuboard-php-support`

**Created**: 2026-08-07

**Status**: Draft

**Input**: User description: "그누보드5 기반 PHP 쇼핑몰 프로젝트를 하네스가 지원하도록 확장. 파일럿(gnuboard5.6.32 레포)에서 검증된 도커 리허설 환경, PHP e2e mise 태스크 패턴, 서버 상주 코드 깃 온보딩 절차를 업스트림 공유 스킬 codi-gnuboard + 프로필 모드 확장으로 증류. apps/gnu-og 를 순정 그누보드 5.6.32 구조 기준으로 삼는다. include test tasks (TDD)"

## Clarifications

### Session 2026-08-07

- Q: PHP 몰 프로필 모드 이름은? → A: `php-monolith` (표면 형태 기술,
  그누보드 외 PHP 모놀리스에도 재사용 가능)
- Q: 새 몰 온보딩 시 레포 구성 단위는? → A: 몰당 1레포, 단일 몰이어도
  `apps/<mall>/` 구조 (하네스 관례·compose 템플릿과 일치)
- Q: PHP 파일 감지 path-scoped 룰을 이번 범위에 포함? → A: 포함 —
  `.php` 감지 시 로드되는 얇은 룰 + 키워드 제안 병행
- Q: PHP e2e 태스크 패턴의 소유 위치는? → A: 게이트 태스크는
  `codi-e2e` canonical 소유 유지, `codi-gnuboard`는 게이트에 꽂히는
  PHP 몰용 스위트 예시만 동반

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 서버 상주 몰 코드의 깃 온보딩 (Priority: P1)

여러 그누보드5 쇼핑몰의 코드가 깃 이력 없이 라이브 서버에만 존재한다.
운영자가 새 몰 프로젝트에 하네스를 설치하면, codi-gnuboard 스킬이
SSH로 코드를 내려받아 깃 저장소로 온보딩하는 절차(내려받기, 제외 목록
설계 — `data/` 업로드 파일·설정/시크릿·DB 덤프 제외, 초기 커밋,
이후 배포 경로)를 단계별로 안내한다.

**Why this priority**: "서버에서 직접 수정"이라는 현재 상태가 이력·백업·
리뷰 부재라는 가장 큰 위험이다. 온보딩 절차 하나만으로도 몰 N개를
깃 관리로 옮기는 핵심 가치가 전달된다.

**Independent Test**: 그누보드 구조를 흉내 낸 테스트 디렉터리를 대상으로
스킬의 온보딩 절차를 따라가면, 제외 목록이 적용된 깃 저장소가 만들어지고
업로드 파일·설정·덤프가 추적되지 않음을 확인할 수 있다.

**Acceptance Scenarios**:

1. **Given** 서버에서 내려받은 그누보드5 코드 사본, **When** 스킬의
   온보딩 절차를 적용, **Then** `data/`·설정 파일·DB 덤프가 깃 추적에서
   제외된 저장소가 생성된다.
2. **Given** 온보딩된 저장소, **When** 라이브 서버 직접 수정을 시도하는
   작업 흐름이 제안됨, **Then** 스킬은 깃 기반 반영 경로를 안내하고 직접
   수정은 가드레일 정책에 따라 승인 대상임을 명시한다.

---

### User Story 2 - 로컬 도커 환경으로 몰 띄우기 (Priority: P2)

개발자가 온보딩된 그누보드 몰을 로컬에서 수정하려면 실행 환경이
필요하다. codi-gnuboard 스킬의 compose 템플릿(resources/)으로 웹(PHP
7.4 + Apache) + DB(MySQL 5.7) 컨테이너를 띄우고, 운영 DB 덤프를
임포트해 로컬에서 화면을 확인하며 수정할 수 있다. 템플릿에는 파일럿에서
실측된 함정 대응이 포함된다: MySQL STRICT 모드와 `0000-00-00` datetime
충돌(sql-mode 비우기), 심볼릭 링크 보존을 위한 레포 루트 마운트,
`data/`(캐시·세션·업로드) 컨테이너 볼륨 분리, Apple Silicon 에뮬레이션.

**Why this priority**: 로컬 환경 없이는 "서버에서 직접 수정"으로 돌아갈
수밖에 없다. P1(깃 온보딩)이 있어야 마운트할 코드가 생기므로 P2다.

**Independent Test**: 템플릿 compose 파일로 컨테이너를 띄우고 그누보드
초기 화면(또는 임포트된 몰 화면)이 브라우저에서 열리는지 확인한다.

**Acceptance Scenarios**:

1. **Given** 온보딩된 몰 저장소와 DB 덤프, **When** 템플릿 기반 compose
   를 기동, **Then** 로컬 브라우저에서 몰 화면이 열린다.
2. **Given** 그누보드 특유의 `0000-00-00` datetime 데이터, **When** 덤프
   임포트, **Then** STRICT 모드 오류 없이 임포트가 완료된다.

---

### User Story 3 - PHP 몰 프로필 인식과 라우팅 (Priority: P3)

그누보드 프로젝트에서 하네스가 Node 전제(apps/front·back, npm/pnpm)로
오작동하지 않아야 한다. `project-profile.yaml`에 PHP 몰 모드를 선언하면
Node 앱 표면 규칙 대신 PHP 몰 규칙(소유 스킬 codi-gnuboard, 허용 경로)
이 적용되고, 스킬 라우팅이 PHP 작업을 codi-gnuboard로 안내한다.

**Why this priority**: P1·P2는 스킬 문서만으로도 가치가 있지만, 프로필
인식이 없으면 세션마다 Node 전제 오진이 반복된다. 독립 배포 가능한
마지막 조각이다.

**Independent Test**: 테스트 프로필에 PHP 몰 모드를 선언하고 기존
프로필 가드 테스트를 확장 실행해, PHP 모드에서 Node 표면 강제가 없고
기존 5개 모드 동작이 그대로임을 확인한다.

**Acceptance Scenarios**:

1. **Given** PHP 몰 모드 프로필, **When** 백엔드/화면 작업 요청, **Then**
   codi-backend/codi-frontend 대신 codi-gnuboard가 소유 스킬로 안내된다.
2. **Given** 기존 프로젝트(기존 5개 모드), **When** 동일 가드 실행,
   **Then** 기존 동작에 회귀가 없다.

---

### Edge Cases

- 그누보드 버전이 5.6.32와 다른 몰(스킨·경로 차이)은? → 스킬은 5.6.32
  (`apps/gnu-og` 원본)를 기준으로 하되, 버전 차이 시 확인할 지점을
  명시한다.
- 운영 DB 덤프에 PII가 포함된 경우는? → 스킬 온보딩 절차가 덤프를 깃
  제외 목록에 두고, 가드레일의 민감정보 규칙(승인 필요)을 참조한다.
- 도커가 없는 환경에서 e2e 게이트는? → 파일럿 패턴처럼 "도커 없음 —
  건너뜀"으로 조용히 스킵하고 증적은 남기지 않는다.
- 하나의 레포에 몰이 여러 개(`apps/<mall>` 복수)인 경우는? → 기본
  관례는 몰당 1레포이지만, 배치 구조가 동일(`apps/<mall>/`)하므로
  파일럿형 멀티몰 레포에서도 같은 마운트 방식이 동작한다.
- 기존 Node 프로젝트가 하네스를 업데이트하면? → PHP 대응은 스킬·프로필
  모드 추가일 뿐, 기존 모드·스킬 동작은 변경하지 않는다.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 하네스는 공유 스킬 `codi-gnuboard`를 제공해야 하며, 이
  스킬은 그누보드5 구조 지식(`skin/`·`extend/`·`data/` 분리, `adm/`
  관리자 구조, `bbs/`·`shop/` 경로)을 5.6.32 순정 원본 기준으로
  설명해야 한다.
- **FR-002**: `codi-gnuboard`는 SSH 서버 상주 코드의 깃 온보딩 절차를
  제공해야 한다: 내려받기, 몰당 1레포 + `apps/<mall>/` 배치, 깃 제외
  목록 설계(`data/` 업로드·캐시, 설정/시크릿 파일, DB 덤프), 초기
  커밋, 이후 깃 기반 반영 경로.
- **FR-003**: `codi-gnuboard`는 로컬 도커 환경 compose 템플릿을
  `resources/`로 동반해야 하며, 템플릿은 파일럿 실측 함정 대응(MySQL
  STRICT 모드 해제, 레포 루트 마운트로 심볼릭 링크 보존, `data/` 볼륨
  분리, Apple Silicon 플랫폼 지정)을 포함해야 한다.
- **FR-004**: `codi-gnuboard`는 e2e 게이트에 꽂히는 PHP 몰용 스위트
  예시(도커 컨테이너 존재 확인 → 스위트 실행 → 없으면 조용히 스킵)를
  `resources/`로 동반해야 한다. 루트 게이트 태스크(`e2e`/`e2e:changed`,
  증적 스탬프)의 canonical 소유는 기존대로 `codi-e2e`에 남는다.
- **FR-005**: `project-profile.yaml`은 `php-monolith` 모드를 선언할 수
  있어야 하고, 해당 모드에서 소유 스킬은 `codi-gnuboard`, Node 앱 표면
  (apps/front·back) 강제는 적용되지 않아야 한다.
- **FR-006**: 프로필 가드와 관련 정책 문서는 새 모드를 인식해야 하며,
  기존 5개 모드(split-front-back, next-fullstack, frontend-only,
  backend-only, planning-only)의 동작은 변경되지 않아야 한다(회귀
  테스트로 증명).
- **FR-007**: 스킬 라우팅은 두 경로로 그누보드/PHP 몰 작업을
  `codi-gnuboard`로 안내해야 한다: (a) 키워드 기반 스킬 제안,
  (b) `.php` 파일 감지 시 로드되는 path-scoped 룰(기존
  `monorepo-packages.md`와 같은 패턴).
- **FR-008**: 라이브 서버 직접 수정은 지원 워크플로에 포함하지 않으며,
  스킬 문서는 깃 기반 반영 경로와 가드레일 승인 원칙을 명시해야 한다.

### Key Entities

- **codi-gnuboard 스킬**: 공유 스킬(`.harness/skills/codi-gnuboard/`).
  구조 지식 + 온보딩 절차 + resources(compose 템플릿, e2e 태스크 조각).
- **PHP 몰 프로필 모드**: `project-profile.yaml`의 신규 mode 값과 그
  규칙 블록(소유 스킬, 허용/금지 경로).
- **순정 원본 참조**: 파일럿 레포 `apps/gnu-og`(그누보드 5.6.32 완전
  원본) — 구조 지식 작성의 기준, 이 레포로 복사하지는 않는다.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 새 그누보드 몰 프로젝트에서 온보딩 절차를 따르면 업로드
  파일·설정·DB 덤프가 추적되지 않는 깃 저장소가 첫 시도에 만들어진다.
- **SC-002**: compose 템플릿 기동 후 로컬 브라우저에서 몰 화면이
  열린다(그누보드 특유 함정으로 인한 기동 실패 0건).
- **SC-003**: PHP 몰 모드 선언 시 세션이 Node 앱 표면(apps/front·back,
  npm/pnpm)을 전제로 안내하는 오진이 발생하지 않는다.
- **SC-004**: 기존 하네스 테스트 스위트가 전부 통과한다 — 기존 5개
  프로필 모드와 Node 스킬 동작에 회귀 0건.
- **SC-005**: 그누보드/PHP 키워드가 포함된 작업 요청에서 codi-gnuboard
  스킬이 제안된다.

## Assumptions

- 대상 그누보드 버전은 5.6.32이며, 구조 기준은 파일럿 레포의
  `apps/gnu-og` 순정 원본이다. 다른 5.x 버전은 "확인 지점" 안내로만
  다룬다.
- PHP 몰 모드의 이름은 `php-monolith`로 확정한다(Clarifications 참조).
- 파일럿 레포 자체의 변경(하네스 버전 업데이트, compose 정리)은 이
  기능의 범위 밖이고 별도 작업이다.
- 파일럿의 프로젝트 룰(`codi-architecture.md`)은 프로젝트 소유 지식으로
  파일럿에 남는다 — 이 기능은 재사용 가능한 일반 지식만 증류한다.
- 배포 자동화(CI에서 서버 반영)는 범위 밖이다. 스킬은 수동 rsync/git
  기반 반영 절차의 안내까지만 다룬다.
- 서버 접근은 SSH가 가능한 환경을 전제한다(FTP 전용 호스팅은 이번
  범위에서 제외).
- Codex 런타임 패리티: 스킬은 `.agents/skills` 병합으로 양 런타임에
  노출된다. 프로필 가드가 훅 수준 변경을 요구하면 기존 어댑터
  (`codex-pretooluse.mjs`) 경로를 재사용한다.
