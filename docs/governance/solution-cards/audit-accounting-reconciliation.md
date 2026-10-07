# Solution Card — Audit, Accounting and Reconciliation Boundaries

## Status
**Proposed / Blocked.**

## Problem
Audit evidence and economic records have different purposes. Combining them into one mutable transaction model creates ambiguity over attribution, accounting truth, corrections, and reconciliation.

## Why
A BUY, SELL, or transfer can have an operational actor and a financial effect. Those facts must remain independently verifiable while still being correlated.

## Purpose
Establish explicit bounded contexts:
- Audit answers who, what, why, when, before, after, and result.
- Accounting answers what economic value moved and how accounts changed.
- Reconciliation answers whether internal and external records agree and identifies exceptions.

## Candidate ISO basis
- ISO/IEC/IEEE 12207:2026 — lifecycle and system definition.
- ISO/IEC 27001:2022 / ISO/IEC 27002:2022 — security, access, segregation of duties, and protection of records.
- ISO 9001:2026 — controlled processes and documented information.
- ISO/IEC 25010:2023 — quality characteristics and evaluation.
- ISO/IEC/IEEE 29119-2/-3:2021 — test processes/documentation.

Exact clause/control applicability SHALL be validated against licensed standards before authorization.

## Alternatives
A. One shared transaction table — rejected.
B. Independent stores without correlation — rejected.
C. Distinct bounded contexts linked by correlation/operation identifiers — preferred candidate.

## Required design decisions before implementation
1. aggregate boundaries;
2. consistency/atomicity strategy;
3. outbox/inbox or equivalent if cross-store atomicity is unavailable;
4. identifier strategy;
5. event ordering;
6. correction/reversal semantics;
7. reconciliation exception lifecycle;
8. data classification;
9. retention;
10. authorization;
11. reporting read models.

## Tests required
Cross-context correlation, failure recovery, duplicate delivery, ordering, idempotency, authorization, consistency, reconciliation, and complete business-operation reconstruction.

## Certification gate
No implementation until the selected design is approved through #270 and the resulting PR passes #271 governance.
