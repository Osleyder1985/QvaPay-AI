# Solution Card — Audit and Control

## Status
**Proposed / Blocked pending authorization under #270.**

## Problem
The system needs durable, reconstructable evidence of relevant actions, decisions, state changes, actors, reasons, and outcomes. Existing operational logs alone do not establish a complete application audit trail.

## Evidence
Related findings include #172, #241, #176, #177, #186 and #280. The new requirement is AUD-FR-001 through AUD-FR-010.

## Risk
Without a controlled audit trail, incidents cannot be reconstructed reliably, unauthorized changes can be difficult to attribute, financial operations can lack independent operational evidence, and compliance evidence can depend on transient infrastructure logs.

## Why
The system needs independent evidence of what happened, who or what caused it, and how state changed. This evidence must remain distinct from business and accounting data.

## Purpose
Provide a trustworthy operational/control evidence layer for incident investigation, security review, change accountability, financial-operation traceability, compliance evidence, and controlled reporting.

## Candidate ISO basis
The exact mapping SHALL be verified against licensed normative text before authorization.

- ISO/IEC 27001:2022 — ISMS requirements.
- ISO/IEC 27002:2022 — control guidance, including logging/monitoring, access, records/evidence and segregation-of-duties areas as applicable.
- ISO 9001:2026 — documented information, controlled operation, performance evaluation and improvement as applicable.
- ISO 19011:2026 — audit methodology and evidence guidance; not a certifiable product standard.
- ISO/IEC/IEEE 12207:2026 — controlled software lifecycle processes.
- ISO/IEC/IEEE 29119-2/-3:2021 — test processes and test documentation.
- ISO/IEC 25010:2023 — software quality evaluation.

## Alternatives
A. Infrastructure-only logging — rejected as sole solution.
B. Mutable audit table — rejected because historical evidence can be altered without controlled correction.
C. Append-oriented application Audit Trail with integrity and governed retention — preferred candidate.

## Proposed solution
Design an append-oriented Audit Trail domain with typed event taxonomy, actor model, target model, before/after representation, correlation/operation IDs, result/error classification, sensitive-data redaction, integrity/provenance, retention, authorization, query/export read models, and audit-of-audit operations.

## Technical impact
Expected components include AuditEvent domain model, repository port, application publisher/use-case boundary, persistence implementation, authorization policy, query/export read model, integrity/evidence mechanism, and retention/archival policy.

No implementation is authorized by this document.

## Tests required
Event completeness, actor attribution, before/after correctness, redaction, tamper detection, access control, audit-of-audit, concurrency/correlation, retention/archival, export reproducibility, and failure behavior when audit persistence is unavailable.

## Documentation required
Event taxonomy, data classification, retention policy, access-control matrix, integrity design, evidence/export procedure, threat model, test plan, and traceability entries.

## Certification gate
Only after implementation, tests, CI, deployment, production evidence, traceability, authorization, and contradiction-free documentation may the requirement become **Certified**.
