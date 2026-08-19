// 병합된 기능정의 rows에서 "서로 다른 Row_ID인데 같은 기능으로 의심되는 쌍"을
// 찾는다. 비차단 경고용 — 오탐이 나도 빌드를 막지 않으므로, 설명 가능한 세 신호만.

function numericPrefix(id) {
  const m = String(id).match(/^(\d+)/);
  return m ? m[1] : null;
}

function normTitle(t) {
  return String(t || '').replace(/\s+/g, '').toLowerCase();
}

// 두 행이 같은 기능으로 의심되는가 (Row_ID는 이미 다름을 전제).
function isSuspect(a, b) {
  const ida = String(a.Row_ID);
  const idb = String(b.Row_ID);
  // a) 숫자 접두사 같음
  const na = numericPrefix(ida);
  const nb = numericPrefix(idb);
  if (na && nb && na === nb) return true;
  // b) id 접두사 포함(한쪽이 다른 쪽으로 시작 + 경계가 '-')
  if (ida.startsWith(idb + '-') || idb.startsWith(ida + '-')) return true;
  // c) Title 정규화 완전 일치. 부분 포함(includes)은 오탐이 많아 제외한다
  //    — "로그인" ⊂ "관리자 로그인", "리워드" ⊂ "리워드 미션" 같은 별개 기능이
  //    실데이터(213행)에서 대량으로 잡혀 경고가 노이즈가 됐다. 공백/대소문자만
  //    정규화한 완전 일치("구매내역"=="구매 내역")만 의심으로 본다.
  const ta = normTitle(a.Title);
  const tb = normTitle(b.Title);
  if (ta && tb && ta === tb) return true;
  return false;
}

export function detectDuplicateSuspects(rows) {
  if (!Array.isArray(rows) || rows.length < 2) return [];
  const suspects = [];
  for (let i = 0; i < rows.length; i += 1) {
    for (let j = i + 1; j < rows.length; j += 1) {
      const a = rows[i];
      const b = rows[j];
      if (String(a.Row_ID) === String(b.Row_ID)) continue; // 같은 id는 정상 병합
      if (isSuspect(a, b)) {
        suspects.push({ a: a.Row_ID, b: b.Row_ID, titleA: a.Title, titleB: b.Title });
      }
    }
  }
  return suspects;
}
