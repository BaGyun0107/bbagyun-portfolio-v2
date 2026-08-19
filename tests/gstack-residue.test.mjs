import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// GStack 제거(018) 회귀 가드: 살아 있는 규칙/스크립트/문서 경로에
// gstack 참조가 재유입되지 않아야 한다. 역사 기록과 롤백 문서는 허용.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const ALLOWED_PREFIXES = [
  'docs/audits/',                      // 감사 기록 (역사 보존)
  'specs/',                            // 과거 스펙 + 018 자신 (역사/맥락)
  'tests/gstack-residue.test.mjs',     // 이 테스트 자신
  'tests/gstack-cleanup.test.mjs',     // 정리 명령 테스트 (참조가 본질)
  '.harness/docs/gstack-rollback.md',  // 롤백 절차 문서 (참조가 본질)
  '.harness/scripts/setup/gstack-cleanup.sh', // 정리 명령 (참조가 본질)
  'ROADMAP.md',                        // 018 피처 디렉터리명 언급 허용
  'CHANGELOG.md',                      // 릴리스 이력 — 제거 기록 서술 허용
  'docs/index.html',                   // 생성물 — 감사 기록 스니펫이 임베드됨
  'docs/planning.html',                // 생성물 — 카탈로그 스니펫이 임베드됨
  'data/feature-definitions.json',     // 피처 카탈로그 — 018 요약이 제거 이력을 서술
];

function isAllowed(file) {
  return ALLOWED_PREFIXES.some((p) => file === p || file.startsWith(p));
}

test('살아 있는 경로에 gstack 참조가 없다', () => {
  const files = execSync('git ls-files', { cwd: ROOT, encoding: 'utf8' })
    .split('\n').filter(Boolean).filter((f) => !isAllowed(f));
  const hits = [];
  for (const file of files) {
    let text;
    try {
      text = readFileSync(join(ROOT, file), 'utf8');
    } catch {
      continue; // 바이너리/읽기 불가 파일은 건너뛴다
    }
    // 피처 디렉터리명·롤백 문서명 언급은 도구 참조가 아니다
    const scrubbed = text
      .replaceAll('018-gstack-to-playwright-mcp', '')
      .replaceAll('gstack-rollback', '')
      .replaceAll('gstack-cleanup', '');
    if (/gstack/i.test(scrubbed)) hits.push(file);
  }
  assert.deepEqual(hits, [], 'gstack 참조 잔존: ' + hits.join(', '));
});
