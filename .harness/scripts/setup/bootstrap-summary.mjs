// 준비 결과 요약 상태 파일 파서 (specs/014-packaging-unification/data-model.md 1절).
//
// stdout 파싱 대신 파일을 쓰는 이유는 research R5 참조 — 하위 단계가
// 각자 append 하고 bootstrap 이 마지막에 한 번 읽는다.
//
// 파싱은 의도적으로 관대하다. 구버전 스크립트가 이 파일을 모르는 상태로
// 섞여도 bootstrap 이 깨지면 안 되므로(계약), 모르는 종류와 형식이 어긋난
// 줄은 던지지 않고 버린다.

import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const EMPTY = () => ({
  version: null,
  reclaimed: null,
  residue: null,
  gitignore: null,
  doctor: null,
});

// 각 종류의 값 파서. 파싱에 실패하면 null 을 돌려주고, 호출부는 그 줄을 버린다.
const VALUE_PARSERS = {
  version(value) {
    const unchanged = value.match(/^unchanged:(.+)$/);
    if (unchanged) {
      const v = unchanged[1];
      return { from: v, to: v, unchanged: true };
    }
    const changed = value.match(/^(.+?)->(.+)$/);
    if (!changed) return null;
    return { from: changed[1], to: changed[2], unchanged: false };
  },
  // legacy 키 — specs/015 부터 생산자가 없다 (reclaim-shared 은퇴). 구버전이
  // 남긴 상태 파일을 관대하게 읽기 위해 파서만 유지하고, 출력은 내지 않는다.
  reclaimed(value) {
    if (!/^\d+$/.test(value)) return null;
    return Number(value);
  },
  // 잔재 보고 (specs/015 US2) — 정리는 소유자 몫이므로 안내만 낸다.
  residue(value) {
    if (!/^\d+$/.test(value)) return null;
    return Number(value);
  },
  // pkg-sync 가 반영한 gitignore 필수 항목 수 (specs/015 US3).
  gitignore(value) {
    if (!/^\d+$/.test(value)) return null;
    return Number(value);
  },
  doctor(value) {
    const m = value.match(/^(\d+)\/(\d+)$/);
    if (!m) return null;
    return { fail: Number(m[1]), warn: Number(m[2]) };
  },
};

/**
 * 요약 상태 파일을 읽어 파싱 결과 객체를 돌려준다.
 * 파일이 없거나 비었거나 읽을 수 없으면 빈 결과다 — 예외를 던지지 않는다.
 *
 * @param {string} filePath `.harness/state/bootstrap-summary` 경로
 * @returns {{version: object|null, reclaimed: number|null, doctor: object|null}}
 */
export function parseBootstrapSummary(filePath) {
  const result = EMPTY();

  let raw;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch {
    return result;
  }

  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (trimmed === '') continue;

    // "<종류> <값>" — 값에 공백이 없다는 규약이라 첫 공백에서만 자른다.
    const sep = trimmed.indexOf(' ');
    if (sep <= 0) continue;

    const kind = trimmed.slice(0, sep);
    const value = trimmed.slice(sep + 1).trim();
    const parser = VALUE_PARSERS[kind];
    if (!parser || value === '') continue;

    const parsed = parser(value);
    // 같은 종류가 여러 번 나오면 마지막 유효 값이 이긴다 (단계 재실행 대비).
    if (parsed !== null) result[kind] = parsed;
  }

  return result;
}

/**
 * 파싱 결과를 사람이 읽을 요약 블록으로 만든다.
 * 값이 없는 항목은 줄 자체를 생략하고, 낼 게 하나도 없으면 빈 문자열이다
 * (호출부가 블록 전체를 생략할 수 있게).
 *
 * @param {ReturnType<typeof parseBootstrapSummary>} summary
 * @returns {string} 개행으로 이어진 요약 블록 (끝 개행 없음)
 */
export function formatBootstrapSummary(summary) {
  const lines = [];

  if (summary.version) {
    const { from, to, unchanged } = summary.version;
    lines.push(
      unchanged ? `  하네스 버전: 변경 없음 (${to})` : `  하네스 버전: ${from} -> ${to}`,
    );
  }

  // reclaimed 는 legacy 키 — 생산자가 없어 출력하지 않는다. 남아 있는 구버전
  // 상태 파일의 "정리됐다"는 과거형 줄이 새 residue 안내와 모순되기 때문이다.

  // 0건은 보고할 변화가 아니므로 줄을 내지 않는다.
  if (summary.gitignore) lines.push(`  gitignore 반영: ${summary.gitignore}건`);

  if (summary.residue) {
    lines.push(
      `  잔재 ${summary.residue}건 — 소유자 정리 필요: ./harness prune-downstream 확인 후 --apply`,
    );
  }

  if (summary.doctor) {
    // 조치 필요 여부는 fail 로만 판단한다 — 계약 예시가 doctor 0/2(경고 2건)를
    // "없음" 으로 보고하므로, 경고는 조치를 강제하지 않는다.
    const { fail, warn } = summary.doctor;
    lines.push(
      fail === 0 ? '  조치 필요: 없음' : `  조치 필요: 실패 ${fail}건, 경고 ${warn}건`,
    );
  }

  if (lines.length === 0) return '';
  return ['준비 완료 요약:', ...lines].join('\n');
}

// CLI 진입점 — bootstrap.sh 가 경로 하나를 넘겨 호출한다.
// 요약 보고가 준비 자체를 막으면 안 되므로 어떤 경우에도 exit 0 이고,
// 낼 게 없으면 아무것도 출력하지 않는다.
function main(argv) {
  const filePath = argv[0];
  if (!filePath) return;
  let text = '';
  try {
    text = formatBootstrapSummary(parseBootstrapSummary(filePath));
  } catch {
    return;
  }
  if (text !== '') process.stdout.write(`${text}\n`);
}

// import 로 쓸 때는 실행하지 않는다.
// argv[1] 을 그대로 비교하면 안 된다: macOS 의 $TMPDIR 처럼 심링크를 거친
// 경로로 호출되면 import.meta.url(실경로)과 어긋나 CLI 가 조용히 아무것도
// 하지 않는다. 양쪽 다 realpath 로 맞춘 뒤 비교한다.
function isDirectRun() {
  const invoked = process.argv[1];
  if (!invoked) return false;
  try {
    return import.meta.url === pathToFileURL(fs.realpathSync(invoked)).href;
  } catch {
    return import.meta.url === pathToFileURL(invoked).href;
  }
}

if (isDirectRun()) {
  main(process.argv.slice(2));
}
