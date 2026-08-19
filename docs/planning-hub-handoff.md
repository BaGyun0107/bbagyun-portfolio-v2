# Planning Hub 운영과 분리 저장소 인계

Planning Hub는 제품 계획과 구현 현황을 같은 ID로 연결하되 원본의
소유권은 분리합니다. 계획 원본은 “무엇을 만들어야 하는가”를, downstream
근거는 “무엇이 구현·검증됐는가”를 설명합니다. reconcile은 두 원본의
차이를 보여주지만 어느 쪽도 자동 수정하지 않습니다.

## 브라우저에서 보기

`mise run docs:build`를 실행한 뒤 다음 두 생성물을 엽니다.

| 페이지 | 열기 | 무엇을 보나 |
| --- | --- | --- |
| 문서 허브 | [하네스 가이드](index.html#harness) / [프로젝트 문서](index.html#project) | 범주, 검색, 문서 목록, Markdown reader |
| Planning Hub | [Planning Hub 열기](planning.html) | 여섯 제품 보기(개요·화면 구조·기능 정의·기능 현황·사용자 흐름·추적성)와 `운영·고급` disclosure |

터미널에서는 macOS 기준으로 `open docs/index.html` 또는
`open docs/planning.html`을 사용할 수 있습니다. 직접 URL을 입력할 때는
`file:///absolute/path/to/repo/docs/index.html#harness` 형태로 엽니다.

문서 허브의 `#harness`/`#project`는 범주를 복원하는 fragment입니다.
문서를 고르면 `#harness:<encoded-path>` 또는 `#project:<encoded-path>`로
확장되어 해당 문서를 다시 열 수 있습니다. Planning Hub에서 기능 정의와
기능 현황은 `selectedFeatureId`를 공유하므로, 하나를 선택하면 같은 stable
feature ID의 정의·배송 상태가 함께 바뀍니다.

## 현재 페이지 구조

`docs/index.html`은 문서 전용 허브입니다. `README.md`, `docs/**/*.md`,
`.harness/docs/**/*.md`, `specs/**/*.md`를 안전한 HTML로 변환해 하네스/프로젝트
범주, 본문 검색, 목록, reader로 보여줍니다.

`docs/planning.html`은 다음 여섯 제품 보기를 가진 통합 Planning Hub입니다.

1. 개요
2. 화면 구조
3. 기능 정의
4. 기능 현황
5. 사용자 흐름
6. 추적성

`운영·고급`은 일곱 번째 보기가 아니라 보조 disclosure로, planning package
version/digest, 동기화 health와 복구 행동, 자동화 기록을 담습니다. 전달
근거(task/코드/인수 검증)는 별도 보기 없이 기능 현황 카드·상세와 개요 요약에
흡수됩니다. 운영·고급을 열고 닫아도 선택된 제품 보기는 바뀌지 않습니다.

화면 구조의 구조·조직도·`계층 목록(접근성 보기)`·표는 표현방식만 다르고 같은
screen ID를 사용합니다. 사이트맵은 화면만 노드로 표시하고, 기능·Spec·테스트·근거는
추적성에서 연결합니다. `P1/P2/P3`은 우선순위이며 정의 lifecycle,
구현 상태, 동기화 상태와 같은 값이 아닙니다.

## Source/generated 소유권

| 계층 | 소유자 | 대표 원본 | 자동화의 권한 |
| --- | --- | --- | --- |
| 문서 내용 | 하네스/프로젝트 문서 소유자 | Markdown, Spec | 읽고 안전하게 projection |
| 제품 계획 | PM/PL·기획 책임자 | need, screen-only sitemap, feature catalog/detail, flow, decision, relation | 승인 workflow 밖에서 읽기 전용 |
| 게시 계약 | planning publisher | `planning-manifest.json` | compiler만 생성 |
| 계획 수신 | downstream 프로젝트 | `planning.lock.json` | `planning:pull`만 원자적 교체 |
| 구현 근거 | 개발·검증 담당 | Spec, task, code, test, declared/observed Delivery Evidence | 원본 소유자가 수정, scanner는 읽기 전용 |
| 차이 조정 | reconcile projection | Sync Result, Change Proposal | 계획/구현 원본을 수정하지 않음 |
| 표시 | page-set generator | `docs/index.html`, `docs/planning.html` | 두 페이지를 함께 재생성 |

`data/sitemap.json`, `data/feature-relations.json`, `data/user-flows.json`도
사람이 소유하는 원본입니다. generator가 생성·정규화·덮어쓰지 않습니다.
두 HTML은 생성물이므로 직접 수정하지 않습니다.

## 생성과 검사

```bash
mise run docs:build
mise run planning:sync
mise run planning:check
mise run planning:watch
```

`docs:build`는 source/model을 한 번 수집하고 문서 renderer와 Planning renderer를
모두 완료한 뒤 두 HTML을 하나의 page set으로 교체합니다. 두 결과 중
하나라도 render/stage에 실패하면 부분적인 새 결과를 정상 상태로 취급하지
않고, 교체된 파일은 rollback하여 마지막 정상 페이지 세트를 보존합니다.
생성 대상 HTML이 symlink인 경우에도 쓰지 않습니다.

`planning:check`는 no-write preview의 `documentsHtml`/`planningHtml`과 디스크의
`docs/index.html`/`docs/planning.html`을 각각 비교합니다. 하나라도 없거나 다르면
missing/stale generated output으로 실패하므로 Stop hook이 있어도 merge 전에
반드시 실행합니다.

새 manifest를 적용하는 명시적 행위만 다음 명령을 사용합니다.

```bash
mise run planning:pull
```

`planning:sync`, watcher, Claude/Codex Stop, CI는 Planning Lock을 바꾸지 않습니다.
`planning:pull`만 후보 manifest의 schema, project ID, digest를 전체 검증한 뒤
임시 파일을 원자 교체합니다.

## 현재 top-down / bottom-up 흐름

Top-down은 확정된 화면·기능·사용자 흐름에 stable ID를 부여하고, 같은
feature ID로 Spec Kit 작업을 시작하는 흐름입니다. 외부 기능정의 문서는
`codi-feature-definition-normalizer`로 schema에 맞춘 뒤
`mise run feature:seed-check "<기능명>"`으로 중복 ID를 확인합니다.

Bottom-up은 downstream의 `specs/<NNN>/status.yaml`, `tasks.md`,
`verification.md`, test/code evidence를 수집해 같은 feature ID의 기능 현황으로
돌려주는 흐름입니다. reconcile은 계획 manifest digest와 소비한 lock/evidence
digest를 비교해 `aligned`, `behind`, `drifted`, `conflicted`,
`collection-failed`를 계산합니다.

현재 구현은 하나의 저장소 안에 배치된 source를 읽는 범위입니다.
`data/hub-workspaces.json`에서 workspace의 `root`, `planningSource`,
`deliverySource`를 저장소 기준 상대 경로로 지정할 수 있습니다. 설정된
`deliverySource`는 저장소 밖으로 나갈 수 없고, symlink는 따라가지 않습니다.

## Claude/Codex 공용 Stop 동기화

Claude Stop과 Codex Stop은 `.harness/hooks/docs-build-on-stop.mjs`의 같은
`runPlanningSyncIfRelevant`를 호출합니다. 런타임별 파일은 payload/cwd만
정규화합니다.

- `data/`, `specs/`, `examples/`, 설정된 `deliverySource` 변경을 분류합니다.
- `docs/index.html`, `docs/planning.html`, automation state log는 재생성 loop를
  막기 위해 입력에서 제외합니다.
- Stop은 fail-open이며 stage, commit, push, PR, 계획 승인, Planning Lock 교체를
  하지 않습니다.
- 직접 편집·hook 미실행은 가능하므로 `planning:check`가 merge-ready
  최종 통제입니다.
- 실행 중인 `planning:watch`는 시작 시점의 root 목록을 감시합니다.
  `data/hub-workspaces.json`을 바꾸거나 새 `deliverySource` root를 생성했다면
  watcher를 재시작합니다.

## 복구 가이드

| 증상 | 확인 | 복구 |
| --- | --- | --- |
| 두 HTML 중 하나가 없거나 예전 화면 | `mise run planning:check` | `mise run docs:build` 후 `mise run planning:check` |
| 문서 허브에 문서가 없음 | Markdown 수집 경로와 변환 health | 원본 Markdown을 고친 뒤 `mise run docs:build` |
| `delivery-source-symlink` | `data/hub-workspaces.json`의 `root`/`deliverySource` | 저장소 안의 실제 디렉터리로 전환; symlink 미지원 |
| watcher가 새 근거 root를 못 봄 | watcher 시작 후 설정/root 추가 여부 | `planning:watch`를 종료하고 재시작 |
| `planning:check`에서 lock/evidence mismatch | manifest, Planning Lock, Delivery Evidence digest | 후보를 검토한 뒤 필요한 경우만 `mise run planning:pull`; 근거 재수집 |
| 복구 불가 source 오류 | Planning Hub `운영·고급` disclosure의 health/action | 원본을 수정하고 sync/build/check 순으로 재실행 |

## 향후 `planning-hub` 분리 저장소

아래는 **현재 자동화가 아니라 향후 아키텍처**입니다. 지금의 명령은 원격
저장소를 clone/fetch/push하거나 PR을 만들지 않습니다.

1. planning 저장소가 사람 소유 need/screen/feature/flow/decision을 유지하고
   immutable manifest를 게시합니다.
2. downstream은 허용된 transport에서 candidate manifest를 받지만 자동 적용하지
   않습니다.
3. 사람이 `planning:pull`을 선택할 때만 완전 검증 후 Planning Lock을
   교체합니다.
4. downstream scanner가 Spec/task/test/code 근거를 Delivery Evidence로 게시합니다.
5. reconcile은 stable ID·digest를 비교해 Sync Result와 Change Proposal만
   만듭니다.
6. proposal은 planning 저장소의 별도 review workflow에서 승인합니다.

별도 저장소 전송을 구현할 때도 repository-relative descriptor, stable ID,
canonical digest, 명시적 승인 경계를 유지해야 합니다. credential URL,
저장소 밖 경로, command/executable field는 계약에서 거부해야 합니다.

## 데모와 실제 데이터

`Community Demo`는 의도적인 누락·drift를 포함하며 `DEMO DATA` 배지를
표시합니다. `Harness Internal` 또는 downstream actual source가 잘못됐을 때
데모로 자동 대체하지 않고 오류 health와 복구 행동을 보여줍니다. 데모가
정상이라는 사실은 actual source가 정상이라는 근거가 아닙니다.
