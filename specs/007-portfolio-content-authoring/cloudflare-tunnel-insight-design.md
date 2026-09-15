# Cloudflare Tunnel 인사이트 후속 설계

**Feature**: 007 Portfolio Content Authoring
**Interview date**: 2026-08-27
**Design approval**: granted
**Public copy approval**: granted on 2026-08-27

## Scope

기존 인사이트 `cloudflare-tunnel-zero-trust-cicd-and-troubleshooting`를 현재
운영 구조와 사용자 회고에 맞춰 재작성한다. 연결 작업물의 전체 하네스 설명이나
CI/CD 실행 스윔레인을 반복하지 않고, 초기 실패를 확인한 뒤 외부 진입 인증과 내부
배포 대상 권한을 분리한 과정에 집중한다.

## Type and source

- Type: `project-case`
- Canonical source: `codi-harness-dx-platform`
- `ai-dx-harness-starter-kit` study: related learning context, not a second origin
- Route: preserve `/insights/cloudflare-tunnel-zero-trust-cicd-and-troubleshooting`
- Project reciprocal relationship: preserve

## Approved title and core message

**Title**: `Cloudflare Tunnel만으로는 배포 경계가 완성되지 않는다`

**Primary message**:

> Cloudflare Tunnel을 연결하는 것만으로 안전한 배포 경로가 완성되는 것은
> 아니다. 외부 진입 인증과 내부 배포 대상 권한을 별도 경계로 설계해야 한다.

**Secondary order**:

1. 이벤트 로그와 workflow 재실행으로 실패 단계를 분리한다.
2. 확인된 실패를 바탕으로 공용 진입점과 서버별 권한을 나눈다.

## Approved evidence

### Historical decision and alternatives

- In April 2026, GitHub Actions needed to deploy to company-operated servers.
- The compared approaches were direct SSH and Cloudflare Tunnel.
- Direct SSH required either broadly opening inbound port 22 or continuously
  managing GitHub Actions IP allow ranges.
- A self-hosted GitHub Actions runner was not a considered alternative at the
  time and must not be added retroactively.

### WAF failure

- A GitHub Actions request was blocked at the Cloudflare WAF stage.
- The block was confirmed in Cloudflare event logs.
- A hostname-based WAF exception was applied.
- Re-running the same workflow passed the previously blocked Cloudflare access
  stage.
- The exception skips the remaining WAF rules for the Bastion hostname. It is
  not a WAF expression that also checks the Service Token.

### Connector and target failure

- The same hostname was connected to Tunnel connectors on different servers.
- A request was directed toward an unintended connector or server direction.
- SSH failed before file transfer or deployment command execution.
- No service was deployed to the wrong server.
- Cloudflare's internal routing algorithm must not be asserted.
- Separating hostnames by deployment target and re-running the workflow reached
  the intended server and completed deployment.

### Current Bastion structure

- Around May 2026, the design changed to one shared Cloudflare entry point and
  one Bastion followed by ProxyJump to deployment targets.
- The reasons were both resource reuse and explicit target authorization:
  - reuse Tunnel, hostname, Access application, and WAF exception;
  - separate `PermitOpen` targets and project-by-server SSH keys.
- The operating controls are implemented, not aspirational:
  - Cloudflare Access Service Token;
  - a Bastion deployment user with shell execution disabled;
  - `PermitOpen` target allowlist;
  - SSH keys separated by project and deployment server;
  - final SSH authentication at each deployment server.
- Cloudflare Tunnel is optional in the harness implementation and enabled only
  for relevant PM2/Docker deployment workflows. It is not needed for managed
  deployment platforms such as Vercel.

### Current operating observation

- Basis date: 2026-08-27.
- Nine projects deploy through one Bastion to five servers.
- Multiple services may share one server, so project and server counts differ.
- Since the Bastion transition, no recurrence of the same unintended connector
  or server-direction problem has been observed.
- This is a user-reported operating observation, not an exhaustive incident
  rate or security guarantee.

### Limits and retrospective

- The Bastion is a single deployment availability boundary. If it stops, new
  deployments for the connected projects stop.
- There has been no deliberate outage test and no observed Bastion outage.
- Running services do not communicate with the Bastion at runtime, but this is
  an architectural boundary, not an outage-test result.
- The hostname-based WAF exception means the Access Token, Bastion
  authentication, `PermitOpen`, and target SSH keys must remain correctly
  operated.
- The first desired improvement is automation for repeated `PermitOpen`,
  public-key registration, and Infisical path wiring.
- Bastion redundancy, an alternate deployment path, and recovery verification
  follow after the configuration automation work.
- These improvements are not completed features and must remain retrospective
  future work.

## Public screen roles

### Project screen

The Codi Harness project remains the project-wide decision entry point. It
summarizes ownership, policies, CI/CD, secrets, deployment, adoption, and
current operating limits. Retain its existing CI/CD and deployment swimlane.

### Insight screen

The insight answers one narrow question: how the design moved from hiding
inbound SSH exposure to separately controlling external entry and internal
deployment targets. Do not repeat the full harness role, Jenkins migration,
Infisical history, or overall project chronology.

## Approved content structure

1. `22번 포트를 열지 않는 것만으로는 충분하지 않았다`
2. `이벤트 로그로 WAF 차단을 확인했다`
3. `같은 hostname의 connector가 배포 대상을 흐렸다`
4. `대상별 hostname은 해결책이면서 다음 운영 부담이 됐다`
5. `공용 진입점과 내부 대상 권한을 분리했다`
6. `9개 프로젝트를 5대 서버에 배포하고 있다`
7. `Bastion도 새로운 운영 경계가 됐다`

## Public disclosure boundary

- Do not claim a wrong-server deployment occurred.
- Do not claim a Cloudflare internal routing algorithm or layer.
- Do not present a Bastion outage or stop test as observed evidence.
- Do not publish real hostnames, IP addresses, tokens, key material, internal
  account names, or private workflow source.
- Do not use “Zero Trust” as a security guarantee. Describe the implemented
  authentication and authorization layers.
- Do not describe the WAF exception as checking both hostname and Service Token.
- Do not generalize nine projects and five servers into availability or security
  statistics.

## Visual design

### Source project

**Visual decision: provided —** retain the existing CI/CD and deployment
swimlane. It explains the current execution sequence from change detection to
deployment verification.

Existing visual disposition: **retain existing swimlane**.

### Cloudflare insight

**Visual decision: provided — data-flow.** The visual answers: “How did the
design separate external entry authentication and internal deployment target
authorization after the initial WAF and connector failures?”

The data-flow contains three evidence-bounded areas:

1. April 2026 initial state:
   - GitHub Actions → WAF block;
   - hostname exception → Cloudflare access passes;
   - one hostname → connector A/B ambiguity;
   - unintended direction → SSH failure;
   - explicit `no actual deployment` label.
2. May 2026 onward:
   - GitHub Actions → Cloudflare Access → Bastion → deployment server;
   - Service Token, shell-disabled user, `PermitOpen`, and project-by-server
     SSH key labels;
   - nine projects and five servers as of 2026-08-27.
3. Current limits:
   - Bastion unavailable → new deployments blocked;
   - explicit `outage test not performed` label;
   - the authentication and key boundaries after the hostname WAF exception.

The project visual explains current CI/CD execution order. The insight visual
explains time evolution and trust/authorization boundaries, so it does not
duplicate the source visual.

## Verification design

- Add RED contracts for the approved title, historical incident boundaries,
  current Bastion controls, operating counts, evidence limits, and `provided`
  data-flow metadata before public mutation.
- Keep the existing route and reciprocal project link.
- Search the project, study, insight fixtures, and E2E expectations for the old
  title and stale Jump Host wording.
- Verify source-to-insight and insight-to-source keyboard activation.
- Verify the project and insight at 320, 768, 1024, and 1440 px.
- Record long-form duplication and visual duplication separately.
- Build and run production E2E on a separate port without touching the port
  1104 development server or its `.next/dev` lock.
- Keep the repository-wide lint baseline separate and inspect only changed
  files and the edited insight block.

## Approval state

The user approved the type/source boundary, title, content outline, disclosure
boundary, visual design, and the complete public title, excerpt, and body.
The exact approved copy is preserved in
`cloudflare-tunnel-insight-approved-copy.md`.
