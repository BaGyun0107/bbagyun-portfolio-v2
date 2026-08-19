import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// 양 런타임(Claude/Codex)의 Playwright MCP 등록·버전 핀 상태를 판정하는
// 점검 모듈 계약 테스트. 모듈은 T008에서 구현된다.
const MOD = '../.harness/scripts/checks/mcp-registration-check.mjs';

function fixtures({ claudeVersion, codexVersion } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'mcp-parity-'));
  const claudePath = join(dir, 'claude.json');
  const codexPath = join(dir, 'config.toml');
  const claude = { mcpServers: {} };
  if (claudeVersion) {
    claude.mcpServers.playwright = {
      type: 'stdio', command: 'npx', args: [`@playwright/mcp@${claudeVersion}`],
    };
  }
  writeFileSync(claudePath, JSON.stringify(claude));
  let toml = '[mcp_servers.node_repl]\ncommand = "node"\nargs = []\n';
  if (codexVersion) {
    toml += `\n[mcp_servers.playwright]\ncommand = "npx"\nargs = ["@playwright/mcp@${codexVersion}"]\n`;
  }
  writeFileSync(codexPath, toml);
  return { claudePath, codexPath };
}

test('핀 버전은 semver 형식의 단일 상수다', async () => {
  const { PINNED_MCP_VERSION } = await import(MOD);
  assert.match(PINNED_MCP_VERSION, /^\d+\.\d+\.\d+$/);
});

test('양 런타임 모두 핀 버전으로 등록되면 ok', async () => {
  const { PINNED_MCP_VERSION, checkMcpRegistration } = await import(MOD);
  const { claudePath, codexPath } = fixtures({
    claudeVersion: PINNED_MCP_VERSION, codexVersion: PINNED_MCP_VERSION,
  });
  const r = checkMcpRegistration({ claudeConfigPath: claudePath, codexConfigPath: codexPath });
  assert.equal(r.ok, true);
  assert.equal(r.claude.registered, true);
  assert.equal(r.claude.pinnedOk, true);
  assert.equal(r.codex.registered, true);
  assert.equal(r.codex.pinnedOk, true);
});

test('Claude 미등록이면 ok=false, claude.registered=false', async () => {
  const { PINNED_MCP_VERSION, checkMcpRegistration } = await import(MOD);
  const { claudePath, codexPath } = fixtures({ codexVersion: PINNED_MCP_VERSION });
  const r = checkMcpRegistration({ claudeConfigPath: claudePath, codexConfigPath: codexPath });
  assert.equal(r.ok, false);
  assert.equal(r.claude.registered, false);
  assert.equal(r.codex.registered, true);
});

test('Codex가 다른 버전이면 pinnedOk=false', async () => {
  const { PINNED_MCP_VERSION, checkMcpRegistration } = await import(MOD);
  const { claudePath, codexPath } = fixtures({
    claudeVersion: PINNED_MCP_VERSION, codexVersion: '0.0.1',
  });
  const r = checkMcpRegistration({ claudeConfigPath: claudePath, codexConfigPath: codexPath });
  assert.equal(r.ok, false);
  assert.equal(r.codex.registered, true);
  assert.equal(r.codex.pinnedOk, false);
});

test('설정 파일이 없으면 미등록으로 판정하고 예외를 던지지 않는다', async () => {
  const { checkMcpRegistration } = await import(MOD);
  const r = checkMcpRegistration({
    claudeConfigPath: '/nonexistent/claude.json',
    codexConfigPath: '/nonexistent/config.toml',
  });
  assert.equal(r.ok, false);
  assert.equal(r.claude.registered, false);
  assert.equal(r.codex.registered, false);
});
