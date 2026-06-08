---
description: Database schema design, normalization, indexing, and integrity standards for SQL, NoSQL, and vector databases
globs: "**/*.{sql,prisma}"
alwaysApply: false
---

# Database Standards

## Core Rules

1. Choose model first, engine second: workload, access pattern, consistency, and scale drive DB selection.
2. For relational workloads, enforce at least **3NF** by default. Break 3NF only with explicit performance justification.
3. For distributed/non-relational workloads, model around aggregates and access paths; document **BASE** and consistency tradeoffs.
4. Document **ACID** expectations for relational transactions. For distributed tradeoffs, document consistency compromises explicitly.
5. Always document the three schema layers: **external schema**, **conceptual schema**, **internal schema**.
6. Treat integrity as first-class: entity, domain, referential, and business-rule integrity must be explicit.
7. Concurrency is never implicit: define transaction boundaries, locking strategy, and isolation level per critical flow.
8. Data standards are mandatory: naming, definition, format, allowed values, and validation rules.
9. Maintain living artifacts: glossary, schema decision log, and capacity estimation — update whenever the model changes.
10. Proactively flag anti-patterns and insecure shortcuts instead of silently implementing them.
11. Vector DBs are retrieval infrastructure, not source-of-truth databases. Store embeddings and metadata there; keep canonical documents elsewhere.
12. Never treat vector search as a drop-in for lexical search. Default to hybrid retrieval when exact match or explainability matters.
13. Embeddings are schema-like assets: version model, dimension, chunking, and preprocessing. Plan re-embedding migrations explicitly.

## SQL Authoring

1. Prefer the project ORM or query builder over raw SQL. Use raw SQL only when
   the ORM cannot express the query safely or clearly.
2. Raw SQL must use parameterized queries or bind parameters. Never interpolate
   user input into SQL strings.
3. Dynamic identifiers such as table names, column names, sort keys, filter
   fields, and direction tokens cannot be bound as parameters. Accept them only
   through explicit allowlists.
4. Production paths must not use `SELECT *`; select the required columns only.
5. Money, currency, and exact quantities must not use `FLOAT`, `REAL`, or
   `DOUBLE`. Use exact numeric types such as `NUMERIC` or `DECIMAL`.
6. Compare nullable values with `IS NULL` or `IS NOT NULL`, not `= NULL` or
   `!= NULL`.
7. Review query anti-patterns before shipping: large-table `LIKE '%keyword%'`,
   `ORDER BY RAND()`, ambiguous `GROUP BY`, accidental cross joins, full scans
   without an index rationale, and join row multiplication.

## Write Safety

1. `UPDATE` and `DELETE` must have a bounded `WHERE` clause. Unbounded writes
   require explicit approval and a documented rollback path.
2. Treat `WHERE 1=1`, broad predicates, missing tenant/account/user scope, and
   cleanup writes without a clear limit or batch plan as dangerous.
3. Multi-tenant data writes must include the tenant, account, organization, or
   user scope predicate that matches the data model.
4. Before a write query, record the expected affected row count. After the
   write, check the actual affected row count and stop if it differs.
5. Multi-step writes need an explicit transaction boundary. Read-modify-write
   flows must keep the read and write inside the same unit of work.
6. Review idempotency, retry behavior, locking, and optimistic concurrency for
   writes that can be retried or run concurrently.
7. Bulk update/delete requires a dry-run `SELECT`, backup or restore point,
   transaction or batch rollback strategy, and explicit approval when data loss
   is possible.

## Migration Safety

1. `DROP`, `TRUNCATE`, destructive `ALTER TABLE`, migration reset, and database
   drop commands require explicit user approval before execution.
2. Migration proposals must document forward and backward strategy, rollback
   or roll-forward plan, data migration impact, lock impact, index build method,
   downtime expectation, and affected services.
3. Auto-generated migrations must be reviewed as human-readable diffs before
   being applied.
4. Schema changes must include verification: migration status, generated SQL
   review, test coverage, or a project-specific migration check command.
5. Do not execute destructive database commands during documentation or policy
   work. Write rules, tests, or review notes instead.

## Production Data and Test Fixtures

1. Production data reads, exports, and samples require explicit approval even
   when the query is read-only.
2. PII, payment data, auth/session/token data, and customer-support records
   must be minimized and redacted before they leave the source system.
3. Prefer synthetic fixtures, anonymized samples, aggregates, counts, and query
   plans over raw production rows.
4. Do not commit production data to tests, snapshots, seed files, docs, PRs,
   issues, or verification notes.

## Migration Review Evidence

Every schema change should leave review evidence:

- generated SQL or schema diff
- affected tables, indexes, services, and runtime paths
- data backfill or data migration plan
- lock impact, index build method, and downtime expectation
- forward/backward migration or roll-forward plan
- verification command and result
- explicit approval note for destructive operations
