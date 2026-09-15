# Research: 백엔드 중심 포트폴리오 비교 화면

## Decision 1: Portfolio proof should emphasize judgment and operations

- **Decision**: Treat the portfolio as a collection of engineering case studies, not a collection of demos or technology badges.
- **Rationale**: Current backend job descriptions repeatedly mention API/service design, database modeling, performance, monitoring, logging, deployment, reliability, and ownership of production behavior. Trigger.dev calls out database design, reliability, throughput, APIs, and observability; Hook Music calls out API contracts, schema evolution, monitoring, and alerting; Megazone calls out performance, database optimization, deployment, monitoring, operations, and tests.
- **Sources**:
  - https://jobs.ashbyhq.com/triggerdev/6f0f1783-fb08-4ec6-97d1-3f2c26005faf
  - https://jobs.ashbyhq.com/hookmusic/9ca73c3b-b233-4dcb-a7cb-b6c1ecdfd0cf
  - https://career.megazone.com/job_posting/Dv8o3jRI

## Decision 2: Use diagrams as first-class evidence

- **Decision**: Every project supports an architecture-flow entry point; the actual artifacts vary by project. Product projects may show a demo plus system/sequence diagrams, while backend and infrastructure projects lead with architecture, data, and operations evidence.
- **Rationale**: Backend work is often invisible in a browser. A public backend-focused portfolio example makes architecture, delivery, runtime, and monitoring directly inspectable. The portfolio should therefore expose judgment through system context, sequence/swimlane flows, ERD, API contracts, and operational evidence.
- **Source**: https://www.kevinguieba.com/en

## Decision 3: ERD is a required evidence type when data modeling is meaningful

- **Decision**: Store ERD metadata and explanatory notes separately from the long-form Markdown. Show core domain entities, relationships, lifecycle, constraints, indexes, and transaction boundaries rather than an undifferentiated full schema.
- **Rationale**: Data modeling, ERD creation, normalization, SQL, and performance analysis recur in formal IT role descriptions. ERD without explanation is not enough; the page must connect model choices to the problem and tradeoffs.
- **Source**: https://www.alio.go.kr/download/download.json?fileNo=2738631

## Decision 4: API contracts can be public without publishing source code

- **Decision**: Do not expose source repositories. Where an API is part of a project, expose a safe, read-only contract or static request/response examples through an artifact block.
- **Rationale**: OpenAPI is a language-agnostic interface description that lets humans and tools understand endpoints, inputs, outputs, and security schemes without source access. This supports a backend demo-like experience while preserving source-code privacy.
- **Source**: https://spec.openapis.org/oas/latest.html

## Decision 5: Operational evidence should be framed around reliability and measurable behavior

- **Decision**: Results and operations sections may include latency, throughput, error rate, cost, deployment state, alerting, recovery, and applicable SLI/SLO context. The content must use only verifiable values.
- **Rationale**: AWS frames architecture around operational excellence, security, reliability, performance efficiency, cost optimization, and sustainability. Google SRE emphasizes defining measurable service behavior and how the team responds when objectives are not met.
- **Sources**:
  - https://docs.aws.amazon.com/wellarchitected/latest/framework/the-pillars-of-the-framework.html
  - https://sre.google/sre-book/service-level-objectives/

## Decision 6: Route-scoped theme state preserves comparison integrity

- **Decision**: Add the theme toggle inside the new comparison route shell rather than changing the baseline route shell in the first pass.
- **Rationale**: The user explicitly wants the current implementation available for comparison. A route-scoped theme wrapper lets the new experience support dark mode without making the old route visually drift during comparison.

## Decision 7: Manual content metadata first, automatic local-history ingestion later

- **Decision**: The first implementation adds reusable evidence metadata and comparison routes. Automatic Claude Code/Codex history ingestion remains a follow-up feature that will consume the planned `DevelopmentLog` concept.
- **Rationale**: Mixing local history parsing, classification, content approval, and the public presentation layer would make the first implementation harder to validate. The public model must be correct before automating intake.
