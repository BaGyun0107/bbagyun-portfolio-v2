// 직접 실행 판정 (심링크 안전).
//
// `import.meta.url === \`file://${process.argv[1]}\`` 형태는 lock 모드에서 깨진다.
// lock 모드의 `.harness/scripts`는 버전 캐시를 가리키는 심링크라
// import.meta.url은 realpath(캐시 경로)로, argv[1]은 심링크 경로로 해석되어
// 두 값이 절대 같아지지 않는다 — 가드가 조용히 false가 되어 CLI가 no-op 한다.
// realpath로 양쪽을 정규화해서 비교한다. macOS의 /var → /private/var
// 리다이렉션에도 같은 정규화가 필요하다.
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function isMain(moduleUrl) {
  try {
    if (!process.argv[1]) return false;
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(moduleUrl));
  } catch {
    return false;
  }
}
