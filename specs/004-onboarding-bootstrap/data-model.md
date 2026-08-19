# Data Model: 하네스 원클릭 온보딩 부트스트랩 (Phase 1)

이 기능은 영속 데이터 저장소를 갖지 않는다. 두 개념 엔티티만 존재한다.

## 도구 버전 정의 (Tool Version Definition)

- **표현**: 루트 `mise.toml`의 `[tools]` 테이블 (커밋됨, 단일 출처)
- **필드**: 도구 이름 → 버전 제약 문자열 (예: `node = "24"`)
- **소비자**: bootstrap.sh(`mise install` 경유), CI, doctor.sh
- **검증 규칙**: FR-004 — bootstrap.sh 본문에 도구 이름이 하드코딩되면 안
  된다. 유일한 예외는 mise 자체와 진입 전제(git/CLT)뿐이다.

## 설치 상태 (Install State)

- **표현**: 실행 시점 환경 검사 결과 (파생 값, 저장 안 함)
- **검사 항목**: OS 종류, CLT 존재(`xcode-select -p`), mise 존재
  (`command -v mise`), 도구 충족(`mise install` 멱등 실행), gh 인증
  (`gh auth status`), Superpowers 설치 여부, doctor 통과 여부
- **상태 전이**: 없음 — 매 실행마다 재파생하며, 이것이 멱등성(FR-003)과
  실패 지점 재개(FR-012)의 근거다. 별도 상태 파일을 만들지 않는다.
