import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

// 하네스 upstream 전용 프로젝트 상태 경로.
// 다운스트림 프로젝트에는 불필요하므로 init-project(--reset-git)와
// `./harness prune-downstream`이 이 목록을 공유해 정리한다.
// 목록을 바꾸려면 이 파일만 고치면 두 경로가 함께 반영된다.

export const UPSTREAM_PROJECT_STATE_PATHS = [
  '.specify',
  'specs',
  'tests',
  'ROADMAP.md',
  'docs/index.html',
  'docs/planning.html',
  '.github/workflows/release.yml',
  '.github/workflows/harness-ci.yml',
  // update-policy 가 "harness demo workspace — never propagated downstream"
  // 이라고 명시하는데도 clone 으로 딸려온다 (2026-07-30 codi-account 실측).
  'examples',
];

// 통째로 지우지 않고 항목 단위로 사본만 골라내는 디렉터리.
//
// specs/: 통째로 지우면 자체 spec 까지 날아가고, 남기면 하네스 사본이 영구히
//   눌러앉아 speckit-specify 가 번호를 upstream 뒤에서 이어 매긴다.
// tests/: 앱 레포가 자체 테스트를 두는 가장 흔한 위치다. 경로 이름만 보고
//   지우면 프로젝트 테스트가 통째로 사라진다.
export const SELECTIVE_PRUNE_DIRS = ['specs', 'tests'];

// `./harness prune-downstream` 이 통째로 지우는 경로 — 위 목록의 부분집합이다.
//
// specs/ 와 tests/ 는 뺀다. 다운스트림 소유물이 섞이는 경로라 항목 단위로
// 사본만 골라 지운다 (SELECTIVE_PRUNE_DIRS 참조).
//
// .specify/ 도 뺀다. 벤더 자산은 install 이 매번 덮어써 갱신하고, 그 안의
// 런타임 상태(feature.json 등)는 프로젝트 소유다. 통째로 지우면 진행 중인
// 기능의 체크포인트가 사라진다.
export const PRUNE_DOWNSTREAM_PATHS = UPSTREAM_PROJECT_STATE_PATHS.filter(
  (p) => p !== '.specify' && !SELECTIVE_PRUNE_DIRS.includes(p),
);

// 이름만으로 지우지 않는 통짜 경로. ROADMAP.md 는 AGENTS.md 가 다운스트림
// durable state 로 규정한 파일이라("P5 Ship: update the root ROADMAP.md")
// 패키지 사본과 바이트 일치(클론 잔재 그대로)일 때만 삭제 대상으로 본다.
// 제목-마커 판정은 쓰지 않는다 — 첫 줄 '# ROADMAP' 은 프로젝트도 흔히 쓰는
// 제목이라 README('# Codi Harness v2')와 달리 오탐 여지가 있다. 사본이
// 없으면(copy 모드·구버전 패키지) 보존한다 — 오삭제보다 잔재 (감사 M-5).
export const CONTENT_GATED_PRUNE_PATHS = ['ROADMAP.md'];

export function isPrunableUpstreamState(relPath, repoRoot, pkgRoot) {
  if (!CONTENT_GATED_PRUNE_PATHS.includes(relPath)) return true;
  try {
    return (
      readFileSync(join(repoRoot, relPath), 'utf8')
      === readFileSync(join(pkgRoot, relPath), 'utf8')
    );
  } catch {
    return false;
  }
}

// upstream 항목 목록의 출처. lock 모드는 패키지에 specs/ 와 tests/ 가 통째로
// 실려 있어 버전과 함께 자동 갱신된다 — 별도 목록을 관리할 필요가 없다.
// copy 모드에는 .harness/current 가 없어 호출자가 정리를 건너뛴다.
export function readUpstreamEntryNames(packageRoot, dirName) {
  try {
    // specs/ 는 디렉터리, tests/ 는 파일이라 타입을 가리지 않는다.
    return readdirSync(join(packageRoot, dirName)).filter((n) => !n.startsWith('.'));
  } catch {
    // 경로가 없거나 읽을 수 없으면 사본이 없는 것으로 본다 — 정리를 건너뛸
    // 뿐 오삭제로는 이어지지 않는다.
    return [];
  }
}

// 레포 항목 중 upstream 사본만 고른다. 이름이 정확히 일치할 때만 사본으로
// 본다 — 다운스트림이 만든 것은 이름이 다르므로 남는다.
//
// 오삭제 가능성: 다운스트림이 우연히 upstream 과 똑같은 이름을 쓰는 경우다.
// spec 은 `NNN-기능설명` 이라 번호와 슬러그가 모두 같아야 하고, 테스트는
// `harness-cli.test.mjs` 처럼 하네스 고유 이름이다. 실측한 다운스트림들은
// 애초에 자체 항목이 없었다 — 남는 위험보다 사본이 영구히 눌러앉는 쪽이
// 실제로 문제였다.
export function selectHarnessCopies(repoEntryNames, upstreamEntryNames) {
  const upstream = new Set(upstreamEntryNames);
  return repoEntryNames.filter((name) => upstream.has(name));
}

// 이름이 같아도 다운스트림이 내용을 채우는 디렉터리. data/ 는 기능정의·
// 사이트맵의 소스라 파일 이름이 upstream 과 같은 채로 프로젝트 데이터가
// 들어간다 — 이름으로 판정하면 그 데이터가 날아간다.
export const CONTENT_MATCH_PRUNE_DIRS = ['data'];

// 내용이 upstream 과 바이트 단위로 같은 파일만 고른다. 한 글자라도 다르면
// 프로젝트가 손댄 것으로 보고 남긴다 — 오삭제보다 잔재를 택한다.
export function selectUntouchedCopies(dirPath, upstreamDirPath, upstreamSpecIds) {
  let names;
  try {
    names = readdirSync(dirPath).filter((n) => !n.startsWith('.'));
  } catch {
    return [];
  }
  return names.filter((name) => {
    try {
      if (readFileSync(join(dirPath, name), 'utf8')
        === readFileSync(join(upstreamDirPath, name), 'utf8')) return true;
    } catch {
      // upstream 에 없거나 읽을 수 없으면 프로젝트 것으로 본다.
      return false;
    }
    // 내용이 다르다고 곧바로 프로젝트 것은 아니다 — 구버전 사본이면 upstream
    // 이 그 뒤로 항목을 추가해 바이트가 갈린다(codi-account: 013 까지 vs
    // 패키지 014 까지). 항목 id 가 전부 upstream spec 에 대응하면 다운스트림
    // 데이터가 없다는 뜻이므로 사본으로 본다.
    return isAllUpstreamEntries(join(dirPath, name), upstreamSpecIds);
  });
}

// ── stale-workcopy 판정 (specs/015 rollout-record 후속 2) ──
// materialize 가 링크로 제공해야 할 자리에 실파일/실디렉터리가 있으면
// "실파일 보존" 경고와 함께 패키지 버전이 영구히 반영되지 않는다 (2026-07-30
// 롤아웃 실측: .harness/vendor 실디렉터리 3개 레포, shared-manifest 실파일).
// 이 경로들은 정책상 upstream 소유(skill-ownership)라 로컬 실사본은 항상
// stale 이다 — 내용 비교 없이 정리 대상으로 본다.
//
// 목록은 materialize.sh 의 link_entry 대상과 짝이다. 드리프트 가드 테스트
// (tests/prune-downstream-project-state.test.mjs)가 materialize 를 실제 실행한
// 링크 집합과 이 목록·lockModeEntries 를 정확 일치로 대조한다 — 한쪽만
// 고치면 테스트가 실패한다. 의도적 예외(scripts/: KEEP_COMMITTED 하위가
// 실디렉터리인 것이 설계, config/: project-owned 파일과 혼재)는 테스트의
// allowlist 에 선언돼 있다.
export const STALE_WORKCOPY_PATHS = [
  '.harness/hooks',
  '.harness/policies',
  '.harness/imported-rules',
  '.harness/prompt-style',
  '.harness/vendor',
  '.harness/skills',
  '.harness/docs',
  '.harness/workflow.md',
  '.harness/manifest.json',
  '.harness/lock.json',
  '.harness/shared-manifest.json',
  '.claude/rules/shared',
  '.claude/settings.json',
  '.codex/rules',
  '.codex/hooks.json',
  '.codex/config.example.toml',
  'ARCHITECTURE.md',
  'CONTRIBUTING.md',
  'lint-staged.config.mjs',
  'docs/harness-overview.md',
  'docs/planning-hub-handoff.md',
  'docs/feature-definition-planning-hub-guide.md',
];

// lock 모드(pkgRoot 존재)에서만 판정한다 — copy 모드는 실사본이 설계 자체다.
// 심링크(정상)·부재 경로는 잡지 않는다.
export function selectStaleWorkcopies(repoRoot, pkgRoot) {
  if (!existsSync(pkgRoot)) return [];
  const found = [];
  for (const rel of STALE_WORKCOPY_PATHS) {
    try {
      if (!lstatSync(join(repoRoot, rel)).isSymbolicLink()) {
        found.push(rel);
      }
    } catch {
      // 경로 없음 — 정상
    }
  }
  return found;
}

// ── harness-selfstate 판정 (specs/015 갭 2) ──
// project-owned 분류가 보호해 어떤 정리 경로도 건드리지 않던 "하네스 자기
// 상태"를 골라낸다. 판정 기준은 항상 패키지(pkgRoot)에서 읽어 버전과 함께
// 자동 갱신된다. 불확실하면 보존한다 (오삭제보다 잔재).
//
// 반환: { path, action } 배열.
//   delete       파일 삭제 (하네스 참조 상태·바이트 일치 사본)
//   uncache      git rm --cached 만 (파일 유지 — install 이 관리하는 벤더 자산)
//   stub-readme  최소 스텁으로 교체
//   normalize    normalize-root-package.mjs 로 정규화
//
// trackedFiles(선택): git 추적 경로 목록. 주어지면 uncache 판정을 추적 중인
// 파일로 한정한다 — uncache 는 "추적 해제" 이므로 이미 비추적이면 잔재가
// 아니다 (apply 후 재감사가 0건으로 수렴하는 조건).
export function selectHarnessSelfstate(repoRoot, pkgRoot, trackedFiles = null) {
  if (!existsSync(pkgRoot)) return [];
  const tracked = trackedFiles === null ? null : new Set(trackedFiles);
  const found = [];

  const bytesEqual = (relPath) => {
    try {
      return (
        readFileSync(join(repoRoot, relPath), 'utf8')
        === readFileSync(join(pkgRoot, relPath), 'utf8')
      );
    } catch {
      return false;
    }
  };

  // 1) .specify/feature.json — 하네스 spec 을 가리키면 잔재
  const featurePath = '.specify/feature.json';
  if (existsSync(join(repoRoot, featurePath))) {
    try {
      const parsed = JSON.parse(readFileSync(join(repoRoot, featurePath), 'utf8'));
      const dir = typeof parsed?.feature_directory === 'string'
        ? parsed.feature_directory.replace(/^specs\//, '')
        : null;
      if (dir && readUpstreamEntryNames(pkgRoot, 'specs').includes(dir)) {
        found.push({ path: featurePath, action: 'delete' });
      }
    } catch {
      // 파싱 불가 — 모르면 보존
    }
  }

  // 2) .specify constitution — 하네스 원본 그대로면 잔재
  const constitutionPath = '.specify/memory/constitution.md';
  if (existsSync(join(repoRoot, constitutionPath)) && bytesEqual(constitutionPath)) {
    found.push({ path: constitutionPath, action: 'delete' });
  }

  // 3) .specify 벤더 자산 — install 이 매 머신 재배치하므로 커밋 불필요.
  //    바이트 일치만 추적 해제(파일 유지). 위 1·2 경로는 제외.
  const handled = new Set([featurePath, constitutionPath]);
  for (const relPath of walkFiles(join(repoRoot, '.specify'))) {
    const repoRel = join('.specify', relPath);
    if (handled.has(repoRel)) continue;
    if (tracked !== null && !tracked.has(repoRel)) continue;
    if (bytesEqual(repoRel)) {
      found.push({ path: repoRel, action: 'uncache' });
    }
  }

  // 4) README — 하네스 README 그대로거나, 제목 줄이 하네스 마커면 스텁 교체
  //    대상. 제목-마커 판정은 구버전 사본(바이트 불일치) 대응이다: 6/6 레포의
  //    README 가 clone 시점 구버전이라 바이트 비교로 못 잡혔다 (2026-07-30
  //    롤아웃 실측, rollout-record 후속 1). 프로젝트가 README 를 이어받으면
  //    제목부터 바꾸므로 마커 판정은 오탐 여지가 없다.
  if (existsSync(join(repoRoot, 'README.md'))) {
    let harnessReadme = bytesEqual('README.md');
    if (!harnessReadme) {
      try {
        const firstLine = readFileSync(join(repoRoot, 'README.md'), 'utf8')
          .split('\n', 1)[0]
          .trim();
        harnessReadme = firstLine === '# Codi Harness v2';
      } catch {
        harnessReadme = false;
      }
    }
    if (harnessReadme) {
      found.push({ path: 'README.md', action: 'stub-readme' });
    }
  }

  // 5) package.json — 하네스 이름 또는 harness-self 스크립트가 남아 있으면 정규화
  const pkgJsonPath = join(repoRoot, 'package.json');
  if (existsSync(pkgJsonPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));
      const scripts = pkg?.scripts ?? {};
      if (
        pkg?.name === 'codi-harness-v2'
        || 'codex:replay-check' in scripts
        || (typeof scripts.check === 'string' && /\bnpm (run )?test\b/.test(scripts.check))
      ) {
        found.push({ path: 'package.json', action: 'normalize' });
      }
    } catch {
      // 파싱 불가 — 보존
    }
  }

  // 6) package-lock.json — 하네스 원본 그대로면 삭제 (다음 install 이 재생성)
  if (existsSync(join(repoRoot, 'package-lock.json')) && bytesEqual('package-lock.json')) {
    found.push({ path: 'package-lock.json', action: 'delete' });
  }

  // 7) docs/audits — 이름+내용 일치하는 하네스 감사 기록 사본만 삭제
  for (const relPath of walkFiles(join(repoRoot, 'docs/audits'))) {
    const repoRel = join('docs/audits', relPath);
    if (bytesEqual(repoRel)) {
      found.push({ path: repoRel, action: 'delete' });
    }
  }

  return found;
}

// 디렉터리 아래 모든 파일의 상대 경로 목록. 없으면 빈 배열.
function walkFiles(dir) {
  const out = [];
  const walk = (current) => {
    let entries;
    try {
      entries = readdirSync(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const abs = join(current, entry.name);
      if (entry.isDirectory()) walk(abs);
      else if (entry.isFile()) out.push(relative(dir, abs));
    }
  };
  walk(dir);
  return out;
}

// JSON 배열의 모든 항목 id 가 upstream spec 목록 안에 있는지 본다.
// 배열이 아니거나 id 가 없으면 판정하지 않는다(false) — 모르면 남긴다.
function isAllUpstreamEntries(filePath, upstreamSpecIds) {
  if (!upstreamSpecIds || upstreamSpecIds.length === 0) return false;
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return false;
  }
  if (!Array.isArray(parsed) || parsed.length === 0) return false;
  const upstream = new Set(upstreamSpecIds);
  return parsed.every((item) => typeof item?.id === 'string' && upstream.has(item.id));
}
