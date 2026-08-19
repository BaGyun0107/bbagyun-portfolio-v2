#!/usr/bin/env node
// 루트 package.json 의 harness-self 항목 정규화 (specs/015 갭 2).
// init-project.sh 의 인라인 로직을 추출해 prune-downstream 과 공유한다.
//
// 정규화 대상:
//   - name: codi-harness-v2 → 프로젝트 이름
//   - scripts.test / scripts.codex:replay-check: 하네스 tests/ 전용 — 제거
//   - scripts.check: npm test 호출부를 떼고 doctor 만 남김
//
// CLI: node normalize-root-package.mjs <package.json 경로> [projectName]
import { readFileSync, writeFileSync } from 'node:fs';

export function normalizeRootPackage(pkg, { projectName } = {}) {
  let changed = false;
  const scripts = pkg.scripts || {};

  // harness-self 전용 — tests/ 를 직접 가리키는 스크립트는 다운스트림에서 무효.
  for (const name of ['test', 'codex:replay-check']) {
    if (name in scripts) {
      delete scripts[name];
      changed = true;
    }
  }

  // check 는 npm test 를 호출하던 부분만 떼어내고 doctor 만 남긴다.
  if (typeof scripts.check === 'string' && /\bnpm (run )?test\b/.test(scripts.check)) {
    scripts.check = './harness doctor';
    changed = true;
  }

  // 하네스 이름이 그대로면 프로젝트 이름으로 교체한다.
  if (pkg.name === 'codi-harness-v2' && projectName) {
    pkg.name = projectName;
    changed = true;
  }

  if (changed) pkg.scripts = scripts;
  return { pkg, changed };
}

const isMain = await (async () => {
  try {
    const { realpathSync } = await import('node:fs');
    const { fileURLToPath } = await import('node:url');
    return (
      realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
    );
  } catch {
    return false;
  }
})();

if (isMain) {
  const [pkgPath, projectName] = process.argv.slice(2);
  if (!pkgPath) {
    console.error('usage: normalize-root-package.mjs <package.json> [projectName]');
    process.exit(2);
  }
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(pkgPath, 'utf8'));
  } catch (err) {
    console.error(`package.json 을 읽을 수 없습니다: ${err.message}`);
    process.exit(1);
  }
  const { pkg, changed } = normalizeRootPackage(parsed, { projectName });
  if (changed) {
    writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
    console.log('package.json harness-self 항목을 정규화했습니다.');
  }
}
