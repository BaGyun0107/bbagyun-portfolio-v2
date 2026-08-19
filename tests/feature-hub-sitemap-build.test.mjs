import { tmp } from './helpers/fixture-base.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, cpSync, rmSync, readFileSync, readdirSync, renameSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { build, writeGeneratedPageSet } from '../.harness/scripts/docs/build-hub.mjs';
import { loadPlanningWorkspace } from '../.harness/scripts/docs/lib/build-workspace-hub-model.mjs';

const FIXTURES = join(
  dirname(fileURLToPath(import.meta.url)),
  'fixtures',
  'feature-hub',
);

// build-hub를 격리된 임시 루트에서 돌린다. data/에 사이트맵/기능정의를
// 배치해 확정·파생 모드 힌트와 렌더 산출물을 검증한다.
function withProject(setup) {
  const root = tmp('codi-hub-build-');
  mkdirSync(join(root, 'data'), { recursive: true });
  mkdirSync(join(root, 'specs'), { recursive: true });
  setup?.(root);
  return { root, done: () => rmSync(root, { recursive: true, force: true }) };
}

const ROWS = [
  { Row_ID: 'R1', Title: '로그인', Area: 'U1-1', Phase_Suggestion: 'P1' },
  { Row_ID: 'R2', Title: '지역 홈', Area: 'U2 홈', Phase_Suggestion: 'P1' },
  { Row_ID: 'R3', Title: '떠도는 기능', Area: '존재안함' },
];

test('build: 확정 사이트맵 → hints에 미배치/빈 노드, exit 0 없이 반환', () => {
  const { root, done } = withProject((r) => {
    cpSync(join(FIXTURES, 'sitemap.valid.json'), join(r, 'data', 'sitemap.json'));
    writeFileSync(join(r, 'data', 'feature-definitions.json'), JSON.stringify(ROWS));
  });
  const res = build(root);
  const html = readFileSync(join(root, 'docs', 'planning.html'), 'utf8');
  done();
  const hints = res.hints.join('\n');
  assert.match(hints, /미배치 기능정의 1건/);
  assert.match(hints, /빈 화면 노드 \d+개/);
  // 사이트맵이 DATA로 주입됨 → 확정 모드 렌더 가능
  assert.match(html, /"sitemap":\{/);
});

test('build: 사이트맵 부재 → 미정의 힌트 + 파생 모드 (DATA.sitemap null)', () => {
  const { root, done } = withProject((r) => {
    writeFileSync(join(r, 'data', 'feature-definitions.json'), JSON.stringify(ROWS));
  });
  const res = build(root);
  const html = readFileSync(join(root, 'docs', 'planning.html'), 'utf8');
  done();
  assert.match(res.hints.join('\n'), /사이트맵 미정의/);
  assert.match(html, /"sitemap":null/);
});

test('build: 스키마 위반 사이트맵 → 경고 + 파생 모드 (fail-open)', () => {
  const { root, done } = withProject((r) => {
    cpSync(join(FIXTURES, 'sitemap.invalid.json'), join(r, 'data', 'sitemap.json'));
    writeFileSync(join(r, 'data', 'feature-definitions.json'), JSON.stringify(ROWS));
  });
  const res = build(root);
  const html = readFileSync(join(root, 'docs', 'planning.html'), 'utf8');
  done();
  assert.match(res.hints.join('\n'), /surface/);
  assert.match(html, /"sitemap":null/);
});

// US3: 사이트맵이 없어도/깨져도 build는 항상 완결된다(생성물 존재).
test('build: fail-open — 부재/위반 어느 경우도 index.html 생성 성공', () => {
  for (const setup of [
    () => {},
    (r) => writeFileSync(join(r, 'data', 'sitemap.json'), '{ broken'),
    (r) => cpSync(join(FIXTURES, 'sitemap.invalid.json'), join(r, 'data', 'sitemap.json')),
  ]) {
    const { root, done } = withProject(setup);
    const res = build(root);
    const html = readFileSync(join(root, 'docs', 'index.html'), 'utf8');
    done();
    assert.ok(html.includes('</html>'), '생성물 완결');
    assert.equal(res.sitemap, null, '파생 모드');
  }
});

test('build: 문서 허브와 Planning Hub를 한 projection set으로 생성하고 no-write preview를 반환한다', () => {
  const { root, done } = withProject((projectRoot) => {
    writeFileSync(join(projectRoot, 'README.md'), '# 프로젝트 안내\n');
  });

  const result = build(root);
  const documentsHtml = readFileSync(join(root, 'docs', 'index.html'), 'utf8');
  const planningHtml = readFileSync(join(root, 'docs', 'planning.html'), 'utf8');
  const preview = build(root, { write: false });

  assert.equal(result.documentsHtml, documentsHtml);
  assert.equal(result.planningHtml, planningHtml);
  assert.equal(result.html, result.documentsHtml, '기존 no-write 호출자를 위한 html alias는 문서 허브를 가리킨다');
  assert.equal(preview.documentsHtml, documentsHtml);
  assert.equal(preview.planningHtml, planningHtml);
  assert.match(documentsHtml, /<title>문서 허브<\/title>/);
  assert.doesNotMatch(documentsHtml, /data-workspace-view=/);
  assert.match(planningHtml, /<title>Planning Hub<\/title>/);
  assert.match(planningHtml, /data-workspace-view=/);
  done();
});

test('build: 두 번째 renderer가 실패하면 기존 두 생성물을 모두 보존한다', () => {
  const { root, done } = withProject((projectRoot) => {
    mkdirSync(join(projectRoot, 'docs'), { recursive: true });
    writeFileSync(join(projectRoot, 'docs', 'index.html'), 'last-good-documents');
    writeFileSync(join(projectRoot, 'docs', 'planning.html'), 'last-good-planning');
  });

  assert.throws(() => build(root, {
    renderers: {
      documents: () => 'partial-documents',
      planning: () => { throw new Error('planning renderer failed'); },
    },
  }), /planning renderer failed/);
  assert.equal(readFileSync(join(root, 'docs', 'index.html'), 'utf8'), 'last-good-documents');
  assert.equal(readFileSync(join(root, 'docs', 'planning.html'), 'utf8'), 'last-good-planning');
  done();
});

test('page-set replace: planning target EISDIR이면 index last-good과 planning directory를 보존하고 temp를 정리한다', () => {
  const { root, done } = withProject((projectRoot) => {
    mkdirSync(join(projectRoot, 'docs'), { recursive: true });
    writeFileSync(join(projectRoot, 'docs', 'index.html'), 'last-good-documents');
    mkdirSync(join(projectRoot, 'docs', 'planning.html'));
  });
  const outDir = join(root, 'docs');

  assert.throws(() => writeGeneratedPageSet(outDir, {
    'index.html': 'next-documents',
    'planning.html': 'next-planning',
  }), /EISDIR|directory|rename/i);

  assert.equal(readFileSync(join(outDir, 'index.html'), 'utf8'), 'last-good-documents');
  assert.equal(statSync(join(outDir, 'planning.html')).isDirectory(), true);
  assert.deepEqual(readdirSync(outDir).sort(), ['index.html', 'planning.html']);
  done();
});

test('page-set replace: 두 번째 rename 실패 시 기존 파일/부재 상태를 복구하고 성공 시 두 파일을 함께 교체한다', () => {
  const { root, done } = withProject((projectRoot) => {
    mkdirSync(join(projectRoot, 'docs'), { recursive: true });
    writeFileSync(join(projectRoot, 'docs', 'index.html'), 'last-good-documents');
  });
  const outDir = join(root, 'docs');
  let renameCount = 0;

  assert.throws(() => writeGeneratedPageSet(outDir, {
    'index.html': 'next-documents',
    'planning.html': 'next-planning',
  }, {
    renameSync(from, to) {
      renameCount += 1;
      if (renameCount === 2) throw new Error('second replace failed');
      renameSync(from, to);
    },
  }), /second replace failed/);
  assert.equal(readFileSync(join(outDir, 'index.html'), 'utf8'), 'last-good-documents');
  assert.equal(readdirSync(outDir).includes('planning.html'), false, '기존 부재 상태 복구');
  assert.deepEqual(readdirSync(outDir), ['index.html']);

  writeGeneratedPageSet(outDir, {
    'index.html': 'next-documents',
    'planning.html': 'next-planning',
  });
  assert.equal(readFileSync(join(outDir, 'index.html'), 'utf8'), 'next-documents');
  assert.equal(readFileSync(join(outDir, 'planning.html'), 'utf8'), 'next-planning');
  assert.deepEqual(readdirSync(outDir).sort(), ['index.html', 'planning.html']);
  done();
});

test('workspace reconcile 오류 projection은 stable source timestamp가 없으면 null로 결정적이다', () => {
  const { root, done } = withProject((projectRoot) => {
    mkdirSync(join(projectRoot, 'planning'), { recursive: true });
    mkdirSync(join(projectRoot, 'downstream'), { recursive: true });
    writeFileSync(join(projectRoot, 'data', 'hub-workspaces.json'), JSON.stringify({
      version: 1,
      defaultWorkspaceId: 'mismatch',
      workspaces: [{ id: 'mismatch', title: 'Mismatch', kind: 'demo', root: '.', planningSource: 'planning', deliverySource: 'downstream' }],
    }));
    writeFileSync(join(projectRoot, 'planning', 'feature-definitions.json'), '[]');
    writeFileSync(join(projectRoot, 'planning', 'feature-details.json'), '[]');
    writeFileSync(join(projectRoot, 'planning', 'planning-manifest.json'), JSON.stringify({ projectId: 'planning-project', digest: 'sha256:planning', features: [] }));
    writeFileSync(join(projectRoot, 'downstream', 'planning.lock.json'), JSON.stringify({ projectId: 'other-project', digest: 'sha256:planning' }));
    writeFileSync(join(projectRoot, 'downstream', 'delivery-evidence.json'), JSON.stringify({ projectId: 'planning-project', consumedManifestDigest: 'sha256:planning', sourceRevision: 'rev', features: [] }));
  });
  const descriptor = { id: 'mismatch', title: 'Mismatch', kind: 'demo', root: '.', rootPath: root, planningSource: 'planning', deliverySource: 'downstream' };
  const workspace = loadPlanningWorkspace(descriptor);
  const first = build(root, { write: false });
  const second = build(root, { write: false });

  assert.equal(workspace.syncResult.status, 'collection-failed');
  assert.equal(workspace.syncResult.generatedAt, null);
  assert.equal(first.planningHtml, second.planningHtml);
  done();
});

test('build: typed relation model을 DATA에 주입하고 health 힌트를 출력한다', () => {
  const relation = {
    version: 1,
    entities: [],
    links: [
      {
        from: { type: 'feature', id: 'R1' },
        to: { type: 'screen', id: 'U1-1' },
        type: 'appears-on',
      },
      {
        from: { type: 'feature', id: 'R1' },
        to: { type: 'screen', id: 'MISSING' },
        type: 'appears-on',
      },
    ],
  };
  const { root, done } = withProject((r) => {
    cpSync(join(FIXTURES, 'sitemap.valid.json'), join(r, 'data', 'sitemap.json'));
    writeFileSync(join(r, 'data', 'feature-definitions.json'), JSON.stringify(ROWS));
    writeFileSync(join(r, 'data', 'feature-relations.json'), JSON.stringify(relation, null, 2));
  });
  const sourceBefore = readFileSync(join(root, 'data', 'feature-relations.json'), 'utf8');
  const res = build(root);
  const html = readFileSync(join(root, 'docs', 'planning.html'), 'utf8');
  const sourceAfter = readFileSync(join(root, 'data', 'feature-relations.json'), 'utf8');
  done();
  assert.equal(res.linkedHub.traceability.configured, true);
  assert.equal(res.linkedHub.traceability.health.brokenLinks.length, 1);
  assert.match(res.hints.join('\n'), /traceability broken 1건/);
  assert.match(html, /"workspaceHub":\{/);
  assert.equal(sourceAfter, sourceBefore, 'docs:build는 사람 소유 relation을 수정하지 않는다');
});

test('build: relation 부재·손상은 기존 허브 생성을 막지 않는다', () => {
  for (const relationText of [null, '{ broken']) {
    const { root, done } = withProject((r) => {
      writeFileSync(join(r, 'data', 'feature-definitions.json'), JSON.stringify(ROWS));
      if (relationText !== null) writeFileSync(join(r, 'data', 'feature-relations.json'), relationText);
    });
    const res = build(root);
    const html = readFileSync(join(root, 'docs', 'index.html'), 'utf8');
    done();
    assert.ok(html.includes('</html>'));
    assert.equal(res.linkedHub.traceability.configured, false);
  }
});

test('build: user-flow model과 health를 DATA에 주입한다', () => {
  const flows = {
    version: 1,
    flows: [{
      id: 'FLOW-R1',
      title: '로그인 검토',
      actor: 'PM',
      goal: '로그인 기능을 확인한다',
      entryStepId: 'start',
      steps: [{
        id: 'start',
        title: '로그인 선택',
        kind: 'start',
        screenIds: ['U1-1'],
        featureIds: ['R1'],
        next: [],
      }],
    }],
  };
  const { root, done } = withProject((r) => {
    cpSync(join(FIXTURES, 'sitemap.valid.json'), join(r, 'data', 'sitemap.json'));
    writeFileSync(join(r, 'data', 'feature-definitions.json'), JSON.stringify(ROWS));
    writeFileSync(join(r, 'data', 'user-flows.json'), JSON.stringify(flows));
  });
  const res = build(root);
  const html = readFileSync(join(root, 'docs', 'planning.html'), 'utf8');
  done();
  assert.equal(res.linkedHub.userFlows.flows.length, 1);
  assert.equal(res.linkedHub.flowLinks.length, 2);
  assert.match(html, /로그인 검토/);
});

test('build: user-flow 부재·손상은 기존 허브 생성을 막지 않는다', () => {
  for (const flowText of [null, '{ broken']) {
    const { root, done } = withProject((r) => {
      writeFileSync(join(r, 'data', 'feature-definitions.json'), JSON.stringify(ROWS));
      if (flowText !== null) writeFileSync(join(r, 'data', 'user-flows.json'), flowText);
    });
    const res = build(root);
    const html = readFileSync(join(root, 'docs', 'index.html'), 'utf8');
    done();
    assert.ok(html.includes('</html>'));
    assert.equal(res.linkedHub.userFlows, null);
  }
});

test('build: 500 feature / 100 screen / 50 flow를 2초 안에 count 손실 없이 생성한다', () => {
  const rows = Array.from({ length: 500 }, (_, index) => ({
    Row_ID: `FEATURE-${String(index + 1).padStart(3, '0')}`,
    Title: `대규모 기능 ${index + 1}`,
    Area: `SCREEN-${String((index % 100) + 1).padStart(3, '0')}`,
    Phase_Suggestion: `P${(index % 4) + 1}`,
  }));
  const screens = Array.from({ length: 100 }, (_, index) => ({
    id: `SCREEN-${String(index + 1).padStart(3, '0')}`,
    title: `화면 ${index + 1}`,
  }));
  const sitemap = {
    version: 1,
    surfaces: [
      { key: 'user', title: '사용자 앱', nodes: screens.slice(0, 70) },
      { key: 'admin', title: '관리자/운영', nodes: screens.slice(70, 90) },
      { key: 'common', title: '공통/시스템', nodes: screens.slice(90) },
    ],
  };
  const relations = {
    version: 1,
    entities: [],
    links: rows.map((row) => ({
      from: { type: 'feature', id: row.Row_ID },
      to: { type: 'screen', id: row.Area },
      type: 'appears-on',
    })),
  };
  const flows = {
    version: 1,
    flows: Array.from({ length: 50 }, (_, index) => ({
      id: `FLOW-${String(index + 1).padStart(2, '0')}`,
      title: `사용자 흐름 ${index + 1}`,
      actor: '사용자',
      goal: `목표 ${index + 1}을 달성한다`,
      entryStepId: 'start',
      steps: [{
        id: 'start',
        title: '시작',
        kind: 'start',
        screenIds: [screens[index % screens.length].id],
        featureIds: [rows[index * 10].Row_ID],
        next: [],
      }],
    })),
  };
  const { root, done } = withProject((projectRoot) => {
    writeFileSync(join(projectRoot, 'data', 'feature-definitions.json'), JSON.stringify(rows));
    writeFileSync(join(projectRoot, 'data', 'sitemap.json'), JSON.stringify(sitemap));
    writeFileSync(join(projectRoot, 'data', 'feature-relations.json'), JSON.stringify(relations));
    writeFileSync(join(projectRoot, 'data', 'user-flows.json'), JSON.stringify(flows));
  });

  const startedAt = performance.now();
  const res = build(root);
  const elapsedMs = performance.now() - startedAt;
  const html = readFileSync(join(root, 'docs', 'planning.html'), 'utf8');
  done();

  assert.ok(elapsedMs < 2000, `build took ${elapsedMs.toFixed(1)}ms`);
  assert.equal(res.serviceDefinitionCount, 500);
  assert.equal(res.sitemap.surfaces.flatMap((surface) => surface.nodes).length, 100);
  assert.equal(res.linkedHub.traceability.links.length, 500);
  assert.equal(res.linkedHub.userFlows.flows.length, 50);
  assert.equal(res.linkedHub.flowLinks.length, 100);
  assert.ok(html.includes('FEATURE-500'));
  assert.ok(html.includes('FLOW-50'));
});

test('build: workspace config가 있으면 legacy Harness Internal을 workspace model로 보존한다', () => {
  const { root, done } = withProject((projectRoot) => {
    cpSync(join(FIXTURES, 'sitemap.valid.json'), join(projectRoot, 'data', 'sitemap.json'));
    writeFileSync(join(projectRoot, 'data', 'feature-definitions.json'), JSON.stringify(ROWS));
    writeFileSync(join(projectRoot, 'data', 'hub-workspaces.json'), JSON.stringify({
      version: 1,
      defaultWorkspaceId: 'harness-internal',
      workspaces: [{ id: 'harness-internal', title: 'Harness Internal', kind: 'internal', root: '.' }],
    }));
  });
  const featureSource = readFileSync(join(root, 'data', 'feature-definitions.json'), 'utf8');
  const res = build(root);
  const html = readFileSync(join(root, 'docs', 'planning.html'), 'utf8');
  assert.equal(readFileSync(join(root, 'data', 'feature-definitions.json'), 'utf8'), featureSource);
  assert.equal(res.workspaceHub.defaultWorkspaceId, 'harness-internal');
  assert.equal(res.workspaceHub.workspaces[0].serviceDefinition.rows.length, ROWS.length);
  assert.match(html, /"workspaceHub":\{/);
  done();
});

test('build: 카탈로그가 있는 downstream workspace는 planning 경로로 로드된다', () => {
  const catalog = [{
    id: 'FEAT-X', title: '기능 X', summary: '데모 기능', actor: 'member',
    priority: 'P1', owner: 'product', definitionStatus: 'approved',
  }];
  const evidence = {
    schemaVersion: 1,
    projectId: 'proj',
    collectedAt: '2026-07-17T00:00:00.000Z',
    workItems: [{
      id: 'WORK-X-1', featureDefinitionId: 'FEAT-X', title: '기능 X 프론트',
      workType: 'frontend', releaseId: 'R1', status: 'in-progress',
      taskRefs: ['specs/x/tasks.md'], evidenceRefs: [],
    }],
  };
  const { root, done } = withProject((r) => {
    mkdirSync(join(r, 'planning'), { recursive: true });
    mkdirSync(join(r, 'downstream'), { recursive: true });
    writeFileSync(join(r, 'planning', 'feature-definitions.json'), JSON.stringify(catalog));
    writeFileSync(join(r, 'downstream', 'delivery-evidence.json'), JSON.stringify(evidence));
    writeFileSync(join(r, 'data', 'hub-workspaces.json'), JSON.stringify({
      version: 1,
      defaultWorkspaceId: 'proj',
      workspaces: [{
        id: 'proj', title: 'Proj', kind: 'downstream', root: '.',
        planningSource: 'planning', deliverySource: 'downstream',
      }],
    }));
  });
  const res = build(root);
  done();
  const ws = res.workspaceHub.workspaces.find(({ id }) => id === 'proj');
  assert.equal(ws.features.length, 1);
  assert.equal(ws.features[0].id, 'FEAT-X');
  assert.equal(ws.featureWorkItems.length, 1);
  assert.equal(ws.featureWorkItems[0].id, 'WORK-X-1');
});

test('build: 미등록 기능 work item은 비차단 힌트로 stub 등록을 안내한다', () => {
  const catalog = [{
    id: 'FEAT-X', title: '기능 X', summary: '데모 기능', actor: 'member',
    priority: 'P1', owner: 'product', definitionStatus: 'approved',
  }];
  const evidence = {
    schemaVersion: 1,
    projectId: 'proj',
    collectedAt: '2026-07-17T00:00:00.000Z',
    workItems: [{
      id: 'WORK-ORPHAN', featureDefinitionId: 'FEAT-NOT-YET', title: '먼저 구현한 작업',
      workType: 'backend', releaseId: 'R1', status: 'in-progress',
      taskRefs: ['specs/x/tasks.md'], evidenceRefs: [],
    }],
  };
  const { root, done } = withProject((r) => {
    mkdirSync(join(r, 'planning'), { recursive: true });
    mkdirSync(join(r, 'downstream'), { recursive: true });
    writeFileSync(join(r, 'planning', 'feature-definitions.json'), JSON.stringify(catalog));
    writeFileSync(join(r, 'downstream', 'delivery-evidence.json'), JSON.stringify(evidence));
    writeFileSync(join(r, 'data', 'hub-workspaces.json'), JSON.stringify({
      version: 1,
      defaultWorkspaceId: 'proj',
      workspaces: [{
        id: 'proj', title: 'Proj', kind: 'downstream', root: '.',
        planningSource: 'planning', deliverySource: 'downstream',
      }],
    }));
  });
  const res = build(root);
  done();
  const hints = res.hints.join('\n');
  assert.match(hints, /미등록 기능 1건/);
  assert.match(hints, /feature:stub/);
});

test('build: specs deliverySource는 spec 스캔 결과를 delivery 근거로 보충 투영한다', () => {
  const catalog = [
    {
      id: 'FEAT-X', title: '기능 X', summary: 'spec 유래', actor: 'member',
      priority: 'P1', owner: 'product', definitionStatus: 'approved',
    },
    {
      id: 'FEAT-Y', title: '기능 Y', summary: 'evidence 우선', actor: 'member',
      priority: 'P1', owner: 'product', definitionStatus: 'approved',
    },
  ];
  const { root, done } = withProject((r) => {
    mkdirSync(join(r, 'planning'), { recursive: true });
    writeFileSync(join(r, 'planning', 'feature-definitions.json'), JSON.stringify(catalog));
    mkdirSync(join(r, 'specs', '001-x'), { recursive: true });
    writeFileSync(join(r, 'specs', '001-x', 'status.yaml'), [
      'id: "001-x"', 'title: "spec X"', 'status: in-progress', 'featureId: "FEAT-X"',
    ].join('\n'));
    writeFileSync(join(r, 'specs', '001-x', 'tasks.md'), '- [x] T1\n- [ ] T2\n- [ ] T3\n');
    mkdirSync(join(r, 'specs', '002-y'), { recursive: true });
    writeFileSync(join(r, 'specs', '002-y', 'status.yaml'), [
      'id: "002-y"', 'title: "spec Y"', 'status: planned', 'featureId: "FEAT-Y"',
    ].join('\n'));
    mkdirSync(join(r, 'specs', '003-broken'), { recursive: true });
    writeFileSync(join(r, 'specs', '003-broken', 'status.yaml'), 'id: "003-broken"\nstatus: nope\n');
    writeFileSync(join(r, 'specs', 'delivery-evidence.json'), JSON.stringify({
      schemaVersion: 1,
      projectId: 'proj',
      collectedAt: '2026-07-17T00:00:00.000Z',
      workItems: [{
        id: 'WORK-Y-EXPLICIT', featureDefinitionId: 'FEAT-Y', title: '명시 작업',
        workType: 'backend', releaseId: 'R1', status: 'in-review',
        taskRefs: ['specs/002-y/tasks.md'], evidenceRefs: [],
      }],
    }));
    writeFileSync(join(r, 'data', 'hub-workspaces.json'), JSON.stringify({
      version: 1,
      defaultWorkspaceId: 'internal',
      workspaces: [{
        id: 'internal', title: 'Internal', kind: 'internal', root: '.',
        planningSource: 'planning', deliverySource: 'specs',
      }],
    }));
  });
  const res = build(root);
  done();
  const ws = res.workspaceHub.workspaces.find(({ id }) => id === 'internal');
  const specItem = ws.featureWorkItems.find(({ featureDefinitionId }) => featureDefinitionId === 'FEAT-X');
  assert.ok(specItem, 'FEAT-X spec projection missing');
  assert.equal(specItem.source, 'spec-scan');
  assert.equal(specItem.status, 'in-progress');
  assert.deepEqual(specItem.tasks, { done: 1, total: 3 });
  const yItems = ws.featureWorkItems.filter(({ featureDefinitionId }) => featureDefinitionId === 'FEAT-Y');
  assert.deepEqual(yItems.map(({ id }) => id), ['WORK-Y-EXPLICIT']);
});

test('build: actor-surface 불일치와 열린 결정을 비차단 힌트로 알린다', () => {
  const catalog = [{
    id: 'FEAT-MOD', title: '검토 기능', summary: '관리자 기능', actor: 'moderator',
    priority: 'P1', owner: 'product', definitionStatus: 'approved',
    placements: [{ screenId: 'SCREEN-FEED', role: 'primary' }],
  }];
  const sitemap = {
    version: 1,
    surfaces: [
      { key: 'user', title: '사용자', nodes: [{ id: 'SCREEN-FEED', title: '피드', children: [] }] },
      { key: 'admin', title: '관리자', nodes: [] },
      { key: 'common', title: '공통', nodes: [] },
    ],
  };
  const decisions = [
    { id: 'DEC-STUB-FEAT-MOD', title: '소급 상세', status: 'open', owner: 'product' },
    { id: 'DEC-OLD', title: '이미 결정됨', status: 'approved', owner: 'product' },
  ];
  const { root, done } = withProject((r) => {
    mkdirSync(join(r, 'planning'), { recursive: true });
    writeFileSync(join(r, 'planning', 'feature-definitions.json'), JSON.stringify(catalog));
    writeFileSync(join(r, 'planning', 'sitemap.json'), JSON.stringify(sitemap));
    writeFileSync(join(r, 'planning', 'decisions.json'), JSON.stringify(decisions));
    writeFileSync(join(r, 'data', 'hub-workspaces.json'), JSON.stringify({
      version: 1,
      defaultWorkspaceId: 'proj',
      workspaces: [{
        id: 'proj', title: 'Proj', kind: 'downstream', root: '.',
        planningSource: 'planning', deliverySource: 'downstream',
      }],
    }));
  });
  const res = build(root);
  done();
  const hints = res.hints.join('\n');
  assert.match(hints, /actor-surface 불일치.*FEAT-MOD.*SCREEN-FEED/);
  assert.match(hints, /열린 결정 1건.*DEC-STUB-FEAT-MOD/);
});

test('build: legacy 기능정의 행이 있으면 카탈로그 변환 힌트를 낸다', () => {
  const { root, done } = withProject((r) => {
    writeFileSync(join(r, 'data', 'feature-definitions.json'), JSON.stringify([
      { Row_ID: 'LEG-1', Title: '레거시 전용 행' },
    ]));
  });
  const res = build(root);
  done();
  assert.match(res.hints.join('\n'), /legacy 기능정의 행 1건.*normalizer/);
});

test('build: legacy 행만 있는 planningSource는 spec 경로를 유지한다', () => {
  const { root, done } = withProject((r) => {
    writeFileSync(join(r, 'data', 'feature-definitions.json'), JSON.stringify(ROWS));
    writeFileSync(join(r, 'data', 'hub-workspaces.json'), JSON.stringify({
      version: 1,
      defaultWorkspaceId: 'internal',
      workspaces: [{
        id: 'internal', title: 'Internal', kind: 'internal', root: '.',
        planningSource: 'data', deliverySource: 'specs',
      }],
    }));
  });
  const res = build(root);
  done();
  const ws = res.workspaceHub.workspaces.find(({ id }) => id === 'internal');
  assert.equal(ws.serviceDefinition.rows.length, ROWS.length);
  assert.equal(ws.featureWorkItems.length, 0);
  assert.equal(ws.deliveryEvidence ?? null, null);
});
