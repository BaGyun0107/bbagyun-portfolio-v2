// M-4 (specs/017 US2): shared-manifest 등재 파일은 전부 다운스트림 도달 경로를
// 가져야 한다 — materialize 링크(루프 토큰), scripts/config 하위 처리,
// KEEP_COMMITTED(+prefix), 명시 예외 중 하나. 어디에도 없는 고아는 migrate 의
// git rm 이후 복원 경로가 없어 lock 전환에서 영구 소실된다 (2026-07-31 감사,
// CONTRIBUTING·.harness/docs 소실과 동일 부류).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { repoRoot } from './helpers/downstream-fixture.mjs';

// 링크·복사 어디에도 없지만 의도적으로 무해한 예외 — 사유 필수.
const COVERAGE_ALLOWLIST = new Set([
  // install.sh/migrate.sh 가 mkdir 로 디렉터리를 보장한다 — 파일 자체는
  // 자리표시자라 소실돼도 동작에 영향 없음.
  '.agents/results/.gitkeep',
]);

test('M-4: manifest 등재 파일마다 다운스트림 도달 경로가 있다 (고아 0건)', async () => {
  const manifest = JSON.parse(
    readFileSync(join(repoRoot, '.harness/shared-manifest.json'), 'utf8'),
  ).files;
  const mat = readFileSync(join(repoRoot, '.harness/scripts/pkg/materialize.sh'), 'utf8');
  const plan = await import('../.harness/scripts/pkg/migrate-plan.mjs');
  const keep = new Set(plan.KEEP_COMMITTED);
  const keepPrefixes = plan.KEEP_COMMITTED_PREFIXES ?? [];

  // 루프 분류는 토큰 모양 추론이 아니라 각 루프의 존재 검사 대상
  // (`[ -e "$PKG/<prefix>$entry" ]`)을 구조적 앵커로 쓴다 (리뷰 지적 #3 —
  // 토큰 모양 추론은 루프에 '/' 포함 토큰이 추가되면 통째로 오분류된다).
  const loops = [
    ...mat.matchAll(
      /for entry in ([\s\S]*?); do\s*\n\s*if \[ -e "\$PKG\/((?:\.harness\/|\.codex\/)?)\$entry" \]/g,
    ),
  ].map((m) => ({
    tokens: m[1].replace(/\\\n/g, ' ').trim().split(/\s+/),
    prefix: m[2],
  }));
  assert.equal(loops.length, 3, 'materialize 링크 루프 파싱 실패 — 구조가 바뀌었으면 앵커를 갱신하라');
  const harnessTokens = loops.filter((l) => l.prefix === '.harness/').flatMap((l) => l.tokens);
  const rootTokens = loops.filter((l) => l.prefix === '').flatMap((l) => l.tokens);
  const codexTokens = loops.filter((l) => l.prefix === '.codex/').flatMap((l) => l.tokens);
  // 하위 단위 처리 경로: skills(스킬 링크 루프), scripts(하위 링크+KEEP cp),
  // config(파일 단위 링크), .claude/rules(shared 통짜 링크).
  const prefixes = ['.harness/skills/', '.harness/scripts/', '.harness/config/', '.claude/rules/'];
  const reaches = (f, t) => f === t || f.startsWith(`${t}/`);
  const orphans = manifest.filter(
    (f) =>
      !keep.has(f)
      && !keepPrefixes.some((p) => f.startsWith(p))
      && !COVERAGE_ALLOWLIST.has(f)
      && !prefixes.some((p) => f.startsWith(p))
      && !harnessTokens.some((t) => reaches(f, `.harness/${t}`))
      && !rootTokens.some((t) => reaches(f, t))
      && !codexTokens.some((t) => reaches(f, `.codex/${t}`)),
  );
  assert.deepEqual(orphans, [], `도달 경로 없는 manifest 파일: ${orphans.join(', ')}`);
  // 예외 목록이 낡지 않게 — allowlist 원소는 실제로 manifest 에 있어야 한다.
  for (const ex of COVERAGE_ALLOWLIST) {
    assert.ok(manifest.includes(ex), `allowlist ${ex} 가 manifest 에 없다 — 예외 정리 필요`);
  }
});

// L-10: 공유 스킬은 전부 skill-triggers.json 키를 갖는다 — UserPromptSubmit
// 제안 훅은 이 키로만 동작하므로, 누락된 스킬은 키워드 제안에서 보이지 않는다.
const TRIGGER_ALLOWLIST = new Set([
  '_shared', // 스킬이 아니라 공용 리소스 디렉터리
]);

test('L-10: .harness/skills 의 모든 스킬은 skill-triggers 키가 있다 (예외는 allowlist)', () => {
  const triggers = JSON.parse(
    readFileSync(join(repoRoot, '.harness/config/skill-triggers.json'), 'utf8'),
  );
  const skills = readdirSync(join(repoRoot, '.harness/skills'), { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
  const missing = skills.filter(
    (s) => !TRIGGER_ALLOWLIST.has(s) && !(s in triggers),
  );
  assert.deepEqual(missing, [], `트리거 없는 스킬: ${missing.join(', ')}`);
  // 역방향: 실재하지 않는 스킬의 트리거 키도 금지.
  const ghost = Object.keys(triggers).filter((k) => !skills.includes(k));
  assert.deepEqual(ghost, [], `실재하지 않는 스킬의 트리거: ${ghost.join(', ')}`);
  for (const ex of TRIGGER_ALLOWLIST) {
    assert.ok(skills.includes(ex), `allowlist ${ex} 가 실재하지 않는다 — 예외 정리 필요`);
  }
});

// 020: 업스트림은 .claude/rules/local/ 이름을 배포할 수 없다 — 다운스트림
// 프로젝트 규칙 링크 트리 자리라, manifest 에 실리면 update 가 덮어쓴다.
test('020: .claude/rules/local 은 배포 금지 (manifest 제외 + 분류기 보장)', async () => {
  const manifest = JSON.parse(
    readFileSync(join(repoRoot, '.harness/shared-manifest.json'), 'utf8'),
  ).files;
  const leaked = manifest.filter((f) => f.startsWith('.claude/rules/local'));
  assert.deepEqual(leaked, [], `배포 금지 경로가 manifest 에 실렸다: ${leaked.join(', ')}`);
  const { isProjectOwned } = await import('../.harness/scripts/setup/project-owned.mjs');
  for (const p of ['.claude/rules/local/team-rule.md', '.harness/rules-local/team-rule.md']) {
    assert.equal(isProjectOwned(p), true, `${p} must be project-owned`);
  }
});
