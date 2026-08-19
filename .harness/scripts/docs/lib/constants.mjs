// 기능 허브 공용 상수 — data-model.md 스키마 기준.
// 로직 없는 순수 선언. 값의 유효성 판정에 쓰인다.

export const STATUSES = ['planned', 'in-progress', 'in-review', 'done', 'on-hold'];

export const PHASES = ['P1', 'P2', 'P3'];

export const DECISION_LEVELS = ['확정', '검토중', '우선결정', '보류검토'];

export const ROLES = ['pm', 'designer', 'frontend', 'backend'];

export const SURFACES = ['UserApp', 'Admin', '둘다'];

// 유효 정방향 인접 전이. on-hold는 어디서든 진입 가능(별도 처리).
export const FORWARD_ORDER = ['planned', 'in-progress', 'in-review', 'done'];
