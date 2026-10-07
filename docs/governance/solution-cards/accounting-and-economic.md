# Solution Card — Accounting and Economic

## Status
**Proposed / Blocked pending authorization under #270 and accounting-framework determination under #286.**

## Problem
The system needs to reconstruct economically relevant operations and produce controlled balances, statements, gains/losses, income/expense reports, reconciliations, and period closes. A mutable transaction history alone is insufficient.

## Evidence
Related financial-integrity findings include #242, #243, #246, #251, #255, #258, #260, #264, #269 and #275-#278. The new requirement is ACC-FR-001 through ACC-FR-013.

## Risk
Without a controlled economic ledger, balances may not be reproducible, gains/losses can be miscomputed, corrections can destroy historical evidence, external discrepancies can remain hidden, and period closes cannot be independently reconstructed.

## Why
Financial operations require a source of economic truth separate from UI state, provider snapshots, operational logs, and audit events.

## Purpose
Provide a controlled economic record from which account statements, balances, income/expense reports, gains/losses, reconciliation reports, and period closes can be reproduced.

## Candidate ISO basis
Exact mapping SHALL be verified against licensed normative text before authorization.

- ISO/IEC 27001:2022 and ISO/IEC 27002:2022 — information security, access, segregation of duties, protection of records, and legal/regulatory controls as applicable.
- ISO 9001:2026 — controlled documented information, operational control, performance evaluation, and improvement as applicable.
- ISO/IEC/IEEE 12207:2026 — lifecycle definition, implementation, operation, maintenance, and controlled information.
- ISO/IEC/IEEE 29119-2/-3:2021 — risk-based testing and test documentation.
- ISO/IEC 25010:2023 — quality evaluation.

ISO standards do not define the accounting framework or tax treatment. Those must be established by #286.

## Alternatives
A. Mutable transaction table with computed balances — rejected.
B. Event history without accounting entries — rejected.
C. Append-oriented economic ledger, preferably double-entry where applicable, with reconciliation and controlled period close — preferred candidate.

## Proposed solution
Design an economic transaction aggregate, chart/account model, ledger account model, journal/entry model, balanced posting rules where double-entry is selected, immutable posted entries, reversal/adjustment mechanism, accounting periods, close/reopen governance, reconciliation records, payment-method references, statement/report read models, and explicit decimal/currency policy.

## Technical impact
Expected components include accounting domain, posting use cases, ledger repository port, reconciliation repository port, accounting-period service, report/read models, external-source adapters, and evidence/provenance storage.

The implementation SHALL define atomicity between business operation, ledger posting, audit event, and reconciliation.

## Tests required
Debit/credit balance, decimal precision/rounding, currency isolation, duplicate/idempotent posting, concurrency, reversal/adjustment, closed-period immutability, close/reopen authorization, statement reproducibility, reconciliation mismatch classes, external reference preservation, payment-data minimization, and failure recovery.

## Documentation required
Accounting-framework applicability matrix, chart/account definitions, posting rules, currency/rounding policy, transaction classification, period-close procedure, reconciliation procedure, payment-data classification, report definitions, retention policy, and traceability matrix.

## Certification gate
Accounting certification is blocked until #286 identifies the applicable accounting/regulatory framework. ISO conformity alone cannot certify financial statement correctness.
