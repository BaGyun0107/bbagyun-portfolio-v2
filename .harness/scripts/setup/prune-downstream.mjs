#!/usr/bin/env node
// 다운스트림 프로젝트에 남아 있는 하네스 upstream 전용 파일을 체크하고 정리한다.
//
// 기본은 check(dry-run): 삭제 대상만 리포트하고 아무것도 지우지 않는다.
// `--apply`를 붙여야 실제로 삭제한다.
//
// upstream(하네스 저장소 자체)에서는 이 경로들이 자기 소유이므로 실행을 거부한다.
// 판정은 generate-manifest.mjs / init-project.sh 의 harness 판정과 동형이다.

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PRUNE_DOWNSTREAM_PATHS,
  SELECTIVE_PRUNE_DIRS,
  CONTENT_MATCH_PRUNE_DIRS,
  isPrunableUpstreamState,
  readUpstreamEntryNames,
  selectHarnessCopies,
  selectHarnessSelfstate,
  selectStaleWorkcopies,
  selectUntouchedCopies,
} from './upstream-project-state.mjs';
import {
  computeRemovals,
  CONSUMER_LINK_ROOTS,
  CONSUMER_LINK_PATHS,
} from '../pkg/migrate-plan.mjs';
import { normalizeRootPackage } from './normalize-root-package.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
// 대상 저장소 루트. cwd 를 우선한다: lock 모드에서 이 스크립트는 버전
// 캐시(~/.codi-harness/versions/<v>/...)에 있고 그 캐시는 하네스 저장소
// clone 이라, 파일 위치로 루트를 잡으면 어느 다운스트림에서 실행해도
// isHarnessRepo()가 true 가 되어 정리가 영구 무력화된다 (2026-07-30 실측).
// 파일 위치 fallback 은 하네스 저장소에서 다른 cwd 로 직접 호출하는 경우용.
function resolveRoot() {
  if (process.env.HARNESS_ROOT) return process.env.HARNESS_ROOT;
  const cwd = process.cwd();
  // cwd 가 git 저장소 루트면 그것을 대상으로 본다.
  try {
    const top = execFileSync('git', ['rev-parse', '--show-toplevel'], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (top) return top;
  } catch {
    // git 저장소가 아니면 파일 위치로 폴백
  }
  return join(HERE, '..', '..', '..');
}
const ROOT = resolveRoot();

// 과거에는 lock 모드에서 조기 종료했다("정리는 migrate 가 담당한다"). 그 전제는
// 거짓이다: migrate 는 이미 전환된 레포를 거부하고, pkg-sync 는 공유 파일만
// 다룰 뿐 tests/ROADMAP.md 같은 upstream clone 잔재는 건드리지 않는다. 결과로
// lock 레포에는 정리 경로가 아예 없었다 (2026-07-30 codi-crawling: 하네스 테스트
// 90개가 그대로 남음). 가드를 걷어내고 lock/copy 양쪽에서 동작하게 한다.

function git(args) {
  try {
    return execFileSync('git', args, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      // 대형 레포의 ls-files 출력이 기본 1MB 버퍼를 넘으면 ENOBUFS로 죽는다
      // (2026-08-07 gnuboard 파일럿 실측 1.4MB).
      maxBuffer: 64 * 1024 * 1024,
    }).trim();
  } catch {
    return '';
  }
}

// generate-manifest.mjs 의 isHarnessRepo 와 동형.
function isHarnessRepo() {
  const originUrl = git(['remote', 'get-url', 'origin']);
  if (originUrl) {
    const trimmed = originUrl.replace(/\/$/, '').replace(/\.git$/, '');
    const canonical = new Set([
      'https://github.com/CODIWORKS-Engineer/codi-harness',
      'https://github.com/CODIWORKS-Engineer/codi-harness-v2',
      'git@github.com:CODIWORKS-Engineer/codi-harness',
      'git@github.com:CODIWORKS-Engineer/codi-harness-v2',
      'ssh://git@github.com/CODIWORKS-Engineer/codi-harness',
      'ssh://git@github.com/CODIWORKS-Engineer/codi-harness-v2',
    ]);
    return canonical.has(trimmed);
  }
  // 원격이 전혀 없는 fresh local clone 만 v1/v2 branch marker 를 허용한다.
  if (git(['remote'])) return false;
  for (const ref of ['refs/heads/v1', 'refs/heads/v2']) {
    try {
      execFileSync('git', ['show-ref', '--verify', '--quiet', ref], {
        cwd: ROOT,
        stdio: ['ignore', 'ignore', 'ignore'],
      });
      return true;
    } catch {
      // 없음 — 다음 후보
    }
  }
  return false;
}

// specs/ 와 tests/ 안의 upstream 사본을 `<dir>/<name>` 상대 경로로 돌려준다.
// 패키지에 실린 upstream 사본이 판정 기준이라 버전과 함께 자동 갱신된다.
function harnessCopies() {
  // lock 모드는 .harness/current, copy 모드는 레포 자신이 upstream 사본을
  // 통째로 갖고 있다 — 후자는 판정 기준이 곧 대상이라 쓸 수 없으므로,
  // lock 이 아니면 정리하지 않는다(사람이 직접 확인).
  const pkgRoot = join(ROOT, '.harness', 'current');
  if (!existsSync(pkgRoot)) return [];

  const found = [];
  for (const dir of SELECTIVE_PRUNE_DIRS) {
    const repoDir = join(ROOT, dir);
    if (!existsSync(repoDir)) continue;

    const upstreamNames = readUpstreamEntryNames(pkgRoot, dir);
    if (upstreamNames.length === 0) continue;

    let repoNames;
    try {
      repoNames = readdirSync(repoDir).filter((n) => !n.startsWith('.'));
    } catch {
      continue;
    }
    for (const name of selectHarnessCopies(repoNames, upstreamNames)) {
      found.push(`${dir}/${name}`);
    }
  }

  // 이름이 같아도 내용이 다르면 프로젝트가 손댄 것이다 (data/ 등).
  for (const dir of CONTENT_MATCH_PRUNE_DIRS) {
    const repoDir = join(ROOT, dir);
    if (!existsSync(repoDir)) continue;
    const specIds = readUpstreamEntryNames(pkgRoot, 'specs');
    for (const name of selectUntouchedCopies(repoDir, join(pkgRoot, dir), specIds)) {
      found.push(`${dir}/${name}`);
    }
  }
  return found;
}

// git 추적 중인 공유·소비 측 링크 잔재 (specs/015 갭 3·4).
// 판정은 migrate-plan 의 단일 출처를 재사용하고, 소비 측 링크는 분리 보고한다.
function trackedResidue(trackedFiles) {
  if (trackedFiles.length === 0) return { shared: [], consumer: [] };
  let manifestFiles = [];
  try {
    manifestFiles = JSON.parse(
      readFileSync(join(ROOT, '.harness/current/.harness/shared-manifest.json'), 'utf8'),
    ).files ?? [];
  } catch {
    // 패키지가 없어도(copy 모드) 소비 측 링크·디렉터리-자체-링크는 잡는다.
  }
  const removals = computeRemovals({ manifestFiles, trackedFiles });
  const isConsumer = (f) =>
    CONSUMER_LINK_ROOTS.some((root) => f === root.slice(0, -1) || f.startsWith(root))
    || CONSUMER_LINK_PATHS.includes(f);
  return {
    shared: removals.filter((f) => !isConsumer(f)),
    consumer: removals.filter(isConsumer),
  };
}

// 분류별 잔재 수집. data-model.md 1절의 클래스 계약과 1:1 대응한다
// (stale-workcopy 는 v1.3.1 후속 — rollout-record 후속 2).
function collectResidue() {
  // 인덱스 읽기는 한 번만 — pkg-sync 가 매 bootstrap 마다 부르는 경로다.
  const trackedFiles = git(['ls-files']).split('\n').filter(Boolean);
  const { shared, consumer } = trackedResidue(trackedFiles);
  const pkgRoot = join(ROOT, '.harness', 'current');
  // 실사본은 stale-workcopy 로 일원화한다 (추적 여부 무관 — apply 가 추적
  // 해제와 삭제를 함께 수행). shared-tracked 와의 중복 표시를 막는다.
  const stale = selectStaleWorkcopies(ROOT, pkgRoot);
  const staleSet = new Set(stale);
  return {
    'shared-tracked': shared.filter((p) => !staleSet.has(p)),
    'consumer-link': consumer.filter((p) => !staleSet.has(p)),
    'stale-workcopy': stale,
    'upstream-state': PRUNE_DOWNSTREAM_PATHS.filter(
      // ROADMAP.md 등 내용-판정 경로는 패키지 사본과 일치할 때만 잔재다 (M-5).
      (p) => existsSync(join(ROOT, p)) && isPrunableUpstreamState(p, ROOT, pkgRoot),
    ),
    'upstream-copy': harnessCopies(),
    'harness-selfstate': selectHarnessSelfstate(ROOT, pkgRoot, trackedFiles),
  };
}

function residueCount(residue) {
  return Object.values(residue).reduce((sum, list) => sum + list.length, 0);
}

function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const countOnly = args.includes('--count');
  const help = args.includes('--help') || args.includes('-h');

  if (help) {
    process.stdout.write(
      [
        '사용법: ./harness prune-downstream [--apply|--count]',
        '',
        '다운스트림 프로젝트에 남은 하네스 upstream 잔재를 분류해 정리한다.',
        '  (기본)   check 모드 — 분류별 잔재만 리포트, 아무것도 바꾸지 않음',
        '  --apply  실제로 정리 (소유자 전용 — 커밋은 직접)',
        '  --count  총 건수만 출력 (pkg-sync 등 호출자용)',
        '',
        '분류와 apply 동작 (specs/015 data-model.md 1절):',
        '  shared-tracked / consumer-link  git 추적만 해제 (워킹트리 링크 유지)',
        `  upstream-state                  통짜 삭제: ${PRUNE_DOWNSTREAM_PATHS.join(', ')}`,
        '  upstream-copy                   specs/·tests/ 이름 일치, data/ 내용 일치 사본 삭제',
        '  harness-selfstate               .specify 하네스 상태·README·package.json/lock·',
        '                                  docs/audits 사본을 삭제/정규화/추적 해제',
        '',
        '판정 기준은 .harness/current 패키지에서 읽고, 불확실하면 보존한다.',
        'upstream(하네스 저장소 자체)에서는 실행을 거부한다.',
        '',
      ].join('\n'),
    );
    return 0;
  }

  // upstream 보호: 하네스 저장소에서는 이 경로들이 자기 소유이므로 거부.
  if (isHarnessRepo()) {
    process.stderr.write(
      '[prune-downstream] 이 저장소는 하네스 upstream입니다. '
        + `${PRUNE_DOWNSTREAM_PATHS.join('/')}는 upstream 소유이므로 정리하지 않습니다.\n`,
    );
    return 2;
  }

  const residue = collectResidue();
  const total = residueCount(residue);

  // --count: pkg-sync 등 호출자가 쓰는 머신 인터페이스 — 총 건수만 출력.
  if (countOnly) {
    process.stdout.write(`${total}\n`);
    return 0;
  }

  if (total === 0) {
    process.stdout.write('[prune-downstream] 정리 대상 없음 — 이미 깨끗합니다.\n');
    return 0;
  }

  const label = (entry) =>
    typeof entry === 'string' ? entry : `${entry.path} (${entry.action})`;

  if (!apply) {
    process.stdout.write(`[prune-downstream] check 모드 — 잔재 ${total}건:\n`);
    for (const [cls, list] of Object.entries(residue)) {
      if (list.length === 0) continue;
      process.stdout.write(`  ${cls} (${list.length}):\n`);
      for (const entry of list) process.stdout.write(`    - ${label(entry)}\n`);
    }
    process.stdout.write('실제로 정리하려면 --apply 를 붙여 다시 실행하세요.\n');
    return 0;
  }

  const gitRm = (path) => {
    try {
      execFileSync('git', ['rm', '-rq', '--cached', '--ignore-unmatch', '--', path], {
        cwd: ROOT,
        stdio: ['ignore', 'ignore', 'ignore'],
      });
    } catch {
      // git 저장소가 아니면 회수할 인덱스도 없다.
    }
  };

  let removed = 0;
  // 추적 잔재: 인덱스에서만 회수 — 워킹트리 링크는 materialize 소유라 유지.
  for (const path of [...residue['shared-tracked'], ...residue['consumer-link']]) {
    gitRm(path);
    removed += 1;
    process.stdout.write(`[prune-downstream] 추적 해제: ${path}\n`);
  }
  // 실사본: 링크 자리를 막는 stale 복사본 — 추적 해제 + 삭제. 다음 pkg-sync
  // 가 그 자리에 패키지 링크를 만든다.
  for (const path of residue['stale-workcopy']) {
    gitRm(path);
    rmSync(join(ROOT, path), { recursive: true, force: true });
    removed += 1;
    process.stdout.write(`[prune-downstream] 실사본 제거(다음 sync 가 링크 생성): ${path}\n`);
  }
  // upstream 상태·사본: 파일 삭제. 삭제는 소유자 커밋(git add -A)이 기록한다.
  for (const path of [...residue['upstream-state'], ...residue['upstream-copy']]) {
    rmSync(join(ROOT, path), { recursive: true, force: true });
    removed += 1;
    process.stdout.write(`[prune-downstream] 제거: ${path}\n`);
  }
  // harness-selfstate: 분류된 action 대로 처리 (data-model.md 1절).
  for (const { path, action } of residue['harness-selfstate']) {
    const abs = join(ROOT, path);
    if (action === 'delete') {
      rmSync(abs, { recursive: true, force: true });
      process.stdout.write(`[prune-downstream] 제거: ${path}\n`);
      removed += 1;
    } else if (action === 'uncache') {
      gitRm(path);
      process.stdout.write(`[prune-downstream] 추적 해제(파일 유지): ${path}\n`);
      removed += 1;
    } else if (action === 'stub-readme') {
      writeFileSync(abs, `# ${basename(ROOT)}\n`);
      process.stdout.write(`[prune-downstream] README 스텁 교체: ${path}\n`);
      removed += 1;
    } else if (action === 'normalize') {
      try {
        const parsed = JSON.parse(readFileSync(abs, 'utf8'));
        const { pkg, changed } = normalizeRootPackage(parsed, {
          projectName: basename(ROOT),
        });
        if (changed) writeFileSync(abs, `${JSON.stringify(pkg, null, 2)}\n`);
        process.stdout.write(`[prune-downstream] package.json 정규화: ${path}\n`);
        removed += 1;
      } catch {
        // 실패는 정리 건수에 넣지 않는다 — 완료 집계가 rollout 기록에 실린다.
        process.stdout.write(`[prune-downstream] 경고: ${path} 정규화 실패 — 보존\n`);
      }
    }
  }
  process.stdout.write(`[prune-downstream] 완료 — ${removed}건 정리.\n`);
  // add -u 를 안내한다: add -A 는 gitignore 가 아직 구버전인 레포에서
  // materialize 링크(비추적)를 도로 인덱스에 넣어 잔재를 재생산한다 (T013 실측).
  process.stdout.write(
    'git status 로 확인 후 소유자가 커밋하세요. 예: git add -u && git commit -m "chore: 하네스 잔재 정리"\n',
  );
  return 0;
}

process.exit(main());
