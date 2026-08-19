import { test } from 'node:test';
import assert from 'node:assert/strict';
import { actorSurfaceMismatches, mergeSitemap } from '../.harness/scripts/docs/lib/merge-sitemap.mjs';

const SURFACES = {
  surfaces: [
    { key: 'user', title: '사용자', nodes: [{ id: 'SCREEN-FEED', title: '피드', children: [] }] },
    { key: 'admin', title: '관리자', nodes: [{ id: 'ADMIN-QUEUE', title: '검토 큐', children: [] }] },
    { key: 'common', title: '공통', nodes: [{ id: 'COMMON-ERROR', title: '오류', children: [] }] },
  ],
};

test('actor-surface: 관리자류 actor가 user 화면에 배치되면 불일치로 잡힌다', () => {
  const mismatches = actorSurfaceMismatches(SURFACES, [
    { id: 'FEAT-A', actor: 'moderator', placements: [{ screenId: 'SCREEN-FEED', role: 'primary' }] },
    { id: 'FEAT-B', actor: 'member', placements: [{ screenId: 'ADMIN-QUEUE', role: 'primary' }] },
    { id: 'FEAT-OK', actor: 'member', placements: [{ screenId: 'SCREEN-FEED', role: 'primary' }] },
  ]);
  assert.deepEqual(mismatches, [
    { featureId: 'FEAT-A', actor: 'moderator', screenId: 'SCREEN-FEED', surface: 'user' },
    { featureId: 'FEAT-B', actor: 'member', screenId: 'ADMIN-QUEUE', surface: 'admin' },
  ]);
});

test('merge: appears-on으로 커버된 화면은 행 미배정이어도 빈 노드로 세지 않는다', () => {
  const sitemap = {
    version: 1,
    surfaces: [{
      key: 'user',
      title: '사용자',
      nodes: [
        { id: 'S-PRIMARY', title: '주 화면', children: [] },
        { id: 'S-SECONDARY', title: '보조 화면', children: [] },
        { id: 'S-NONE', title: '정의 없는 화면', children: [] },
      ],
    }],
  };
  const rows = [{ Row_ID: 'F-1', Title: '기능', Area: '' }];
  const board = mergeSitemap(sitemap, rows, {
    screenAssignments: { 'F-1': ['S-PRIMARY', 'S-SECONDARY'] },
  });
  assert.equal(board.unassignedCount, 0);
  assert.equal(board.emptyNodeCount, 1);
});

test('actor-surface: workspace actorClasses로 어휘를 확장할 수 있다', () => {
  const options = { actorClasses: { admin: ['teacher'], user: ['student'] } };
  const mismatches = actorSurfaceMismatches(SURFACES, [
    { id: 'FEAT-T', actor: 'Teacher', placements: [{ screenId: 'SCREEN-FEED', role: 'primary' }] },
    { id: 'FEAT-S', actor: 'student', placements: [{ screenId: 'ADMIN-QUEUE', role: 'primary' }] },
    { id: 'FEAT-M', actor: 'moderator', placements: [{ screenId: 'SCREEN-FEED', role: 'primary' }] },
  ], options);
  assert.deepEqual(mismatches.map(({ featureId }) => featureId), ['FEAT-T', 'FEAT-S', 'FEAT-M']);
});

test('actor-surface: 목록 밖 actor, common surface, 미배치는 침묵한다 (fail-open)', () => {
  assert.deepEqual(actorSurfaceMismatches(SURFACES, [
    { id: 'FEAT-C', actor: 'system', placements: [{ screenId: 'SCREEN-FEED', role: 'primary' }] },
    { id: 'FEAT-D', actor: 'moderator', placements: [{ screenId: 'COMMON-ERROR', role: 'primary' }] },
    { id: 'FEAT-E', actor: 'moderator', placements: [] },
    { id: 'FEAT-F', placements: [{ screenId: 'SCREEN-FEED', role: 'primary' }] },
  ]), []);
  assert.deepEqual(actorSurfaceMismatches(null, [{ id: 'FEAT-G', actor: 'member', screenIds: ['X'] }]), []);
});

const SITEMAP = {
  version: 1,
  surfaces: [
    {
      key: 'user',
      title: '사용자 앱',
      nodes: [
        {
          id: 'U1',
          title: '회원/온보딩',
          aliases: ['회원'],
          children: [{ id: 'U1-1', title: '로그인' }],
        },
        { id: 'U2 홈', title: '지역 홈' },
      ],
    },
    { key: 'admin', title: '관리자/운영', nodes: [{ id: 'A1', title: '운영 대시보드' }] },
    { key: 'common', title: '공통/시스템', nodes: [{ id: 'C1', title: '알림/메시징' }] },
  ],
};

const row = (id, area, extra = {}) => ({ Row_ID: id, Title: id, Area: area, ...extra });

test('merge: Area가 노드 id와 정확 일치하면 배치', () => {
  const res = mergeSitemap(SITEMAP, [row('R1', 'U2 홈')]);
  assert.equal(res.derived, false);
  const user = res.surfaces.find((s) => s.key === 'user');
  const node = user.nodes.find((n) => n.id === 'U2 홈');
  assert.equal(node.rows.length, 1);
  assert.equal(res.unassigned.length, 0);
});

test('merge: alias 일치와 trim 처리', () => {
  const res = mergeSitemap(SITEMAP, [row('R1', ' 회원 '), row('R2', 'U1-1')]);
  const user = res.surfaces.find((s) => s.key === 'user');
  const u1 = user.nodes.find((n) => n.id === 'U1');
  assert.equal(u1.rows.length, 1, 'alias 회원 -> U1');
  assert.equal(u1.children[0].rows.length, 1, '자식 노드 id 매칭');
});

test('merge: 불일치 행은 미배치 버킷', () => {
  const res = mergeSitemap(SITEMAP, [row('R1', '존재안함')]);
  assert.equal(res.unassigned.length, 1);
  assert.equal(res.unassignedCount, 1);
});

test('merge: 0건 노드는 유지되고 emptyNodeCount에 잡힘', () => {
  const res = mergeSitemap(SITEMAP, [row('R1', 'U2 홈')]);
  const common = res.surfaces.find((s) => s.key === 'common');
  assert.equal(common.nodes.length, 1, '0건 노드 제거 금지');
  // U1(자식 포함 0), U1-1, A1, C1 이 비어 있음
  assert.equal(res.emptyNodeCount, 4);
});

test('merge: subtree 합계 — 자식에 행이 있으면 부모는 빈 노드 아님', () => {
  const res = mergeSitemap(SITEMAP, [row('R1', 'U1-1')]);
  const user = res.surfaces.find((s) => s.key === 'user');
  const u1 = user.nodes.find((n) => n.id === 'U1');
  assert.equal(u1.total, 1);
  assert.equal(u1.rows.length, 0);
});

test('merge: 파생 모드(null) — user/admin 2그룹, 미배치 없음', () => {
  const rows = [
    row('R1', 'U2 홈', { Surface: 'UserApp' }),
    row('R2', 'A2 운영', { Surface: 'Admin' }),
  ];
  const res = mergeSitemap(null, rows);
  assert.equal(res.derived, true);
  assert.equal(res.surfaces.length, 2);
  assert.equal(res.unassigned.length, 0);
  const admin = res.surfaces.find((s) => s.key === 'admin');
  assert.ok(admin.nodes.some((n) => n.id === 'A2 운영'));
});

test('merge: 빈 입력 방어', () => {
  const res = mergeSitemap(null, []);
  assert.equal(res.derived, true);
  assert.ok(Array.isArray(res.surfaces));
});

test('merge: 명시적 appears-on screen 관계가 Area fallback보다 우선한다', () => {
  const row = { Row_ID: 'R-OVERRIDE', Title: '명시 화면', Area: 'U1-1' };
  const result = mergeSitemap(SITEMAP, [row], {
    screenAssignments: { 'R-OVERRIDE': ['U2 홈'] },
  });
  const u1 = result.surfaces[0].nodes[0].children[0];
  const u2 = result.surfaces[0].nodes[1];
  assert.equal(u1.rows.length, 0);
  assert.deepEqual(u2.rows, [row]);
});
