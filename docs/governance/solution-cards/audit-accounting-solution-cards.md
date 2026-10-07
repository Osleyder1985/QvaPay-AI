# Audit and Accounting ISO-Backed Solution Cards

## Status

**Design stage only — no runtime implementation authorized by this document.**

This document applies the mandatory decision sequence established by Issue #270:

**Finding → objective evidence → risk/impact → requirement → applicable ISO criterion → alternatives → selected solution → Why → Purpose → impact → tests → documentation → implementation → verification → objective evidence → certification.**

The requirements covered here are defined in #283, #284, #285 and #286. The baseline documentation is proposed in PR #288.

---

## 1. Solution Card — Audit Trail Persistence, Integrity, Retention and Access

### Problem / finding

The system needs a first-class Audit and Control capability. Existing application logs and operational state are not sufficient to provide a persistent, queryable, attributable and preserved record of security, administration, configuration, identity, operational and financially relevant actions.

### Objective evidence

The requirement baseline in #283 explicitly requires durable audit records containing actor, action, target, reason, source, before/after state, result, correlation identifiers, provenance, classification and retention metadata. It also explicitly states that ordinary application logs do not satisfy the requirement.

### Risk / impact

Without a controlled audit trail:

- actions may not be attributable to a unique actor;
- state transitions may be impossible to reconstruct;
- security investigations may lack reliable evidence;
- unauthorized alteration or deletion may go undetected;
- audit access itself may be invisible;
- retention and evidence-preservation obligations may not be demonstrable.

### Affected requirements

- SYS-AUD-001..008
- SWR-AUD-001..003

### Applicable ISO criteria

**ISO/IEC 27001:2022 / ISO/IEC 27002:2022**

The relevant control set includes:

- **5.15 Access control** — governs authorized access to information and associated assets.
- **5.18 Access rights** — governs provisioning, review, modification and termination of access rights.
- **5.33 Protection of records** — relevant to protecting records from loss, destruction, falsification, unauthorized access or release.
- **8.15 Logging** — relevant to generation and management of event logs.
- **8.16 Monitoring activities** — relevant to monitoring systems and events.

ISO/IEC 27002:2022 is the control-guidance standard supporting implementation of the ISO/IEC 27001 ISMS requirements.

**ISO/IEC 25010:2023**

The product-quality model is applicable to software requirements and evaluation. Its security quality concepts include properties such as integrity, non-repudiation, accountability and authenticity, which directly support the requirement for attributable and tamper-resistant evidence.

**ISO 9001**

The quality-management framework is relevant to controlled documented information, process operation, monitoring, measurement and evidence of achieved results. ISO's guidance explicitly connects documented information with controlled processes and retained evidence.

**ISO 19011:2026**

This is an audit-guidance standard, not a product-security control. It is applicable to the evidence model because audit evidence must be relevant to audit criteria and verifiable. The current edition is ISO 19011:2026; the 2018 edition is withdrawn.

### Alternatives considered

**A. Application logs only**

Rejected. Logs are operational telemetry and do not by themselves provide the required controlled evidence lifecycle, access auditing, retention semantics or state-transition model.

**B. Audit records embedded in each business table**

Rejected as the primary architecture. This duplicates audit logic, makes cross-domain querying difficult and encourages mutable business history to be treated as evidence.

**C. Dedicated Audit and Control bounded context behind an application port**

Selected.

### Selected solution

Create a dedicated Audit and Control capability with:

- an append-oriented audit-event model;
- explicit application/domain port for recording events;
- infrastructure adapter for durable persistence;
- immutable event identity and canonical timestamp;
- actor and authentication context;
- action and target identifiers;
- before/after state where semantically appropriate;
- outcome and failure/rejection reason;
- correlation/request/operation identifiers;
- non-secret metadata;
- classification and retention metadata;
- integrity/provenance evidence;
- role-controlled query and export;
- auditable access to the audit trail itself.

Audit records must not contain passwords, access tokens, CVV, PINs or unnecessary sensitive data.

### Why?

Because the system needs evidence that is attributable, durable and independently queryable rather than merely diagnostic telemetry. The selected boundary also prevents every business capability from inventing its own incompatible audit model.

### Purpose?

To make security, administrative, operational and financial actions reconstructible and verifiable without rewriting business history.

### Impact

**Technical:** introduces audit ports, schema, persistence, indexing and query/export APIs.

**Functional:** every auditable use case must emit a defined event.

**Security:** strengthens access control, accountability and evidence integrity.

**Operational:** introduces retention, capacity, review and preservation procedures.

**Performance:** audit writes must be bounded and must not allow unbounded metadata or request bodies.

### Required tests

- event creation for every classified auditable operation;
- actor attribution and role context;
- before/after correctness;
- correlation ID propagation;
- failed/rejected operation recording;
- audit-access events;
- unauthorized audit query/export rejection;
- tamper/alteration detection;
- retention and preservation behavior;
- payload-size and metadata limits;
- secret/data-minimization tests;
- concurrency and duplicate-event behavior;
- failure handling when the audit store is unavailable.

### Required documentation

- audit event catalog;
- classification and retention policy;
- access-control matrix;
- evidence/export procedure;
- audit-store capacity and failure policy;
- schema and migration documentation;
- API contract;
- test evidence;
- operational review procedure.

### Verification evidence

Required before Verified:

- repository test evidence;
- schema/migration evidence;
- security verification;
- CI evidence;
- deployed runtime evidence;
- representative audit records with no secrets;
- access-control evidence;
- preservation/integrity evidence.

### Certification gate

Not certifiable until the complete evidence chain exists and #270/#186 authorization conditions are satisfied.

---

## 2. Solution Card — Accounting Ledger and Double-Entry Model

### Problem / finding

The requested Accounting and Economic capability must reconstruct economic history, balances, income/expenses, gains/losses, BUY/SELL operations, transfers, fees and corrections. A mutable transaction table is insufficient if historical economic state must be reproducible.

### Objective evidence

#284 requires a persistent economic ledger covering economically relevant operations and explicitly requires evaluation of a double-entry/general-ledger model.

### Risk / impact

A transaction-only design can permit:

- unbalanced economic movements;
- ambiguous asset/currency direction;
- overwritten historical values;
- irreproducible balances;
- incorrect P&L;
- weak reconciliation;
- uncontrolled corrections;
- inability to reproduce a period close.

### Affected requirements

- SYS-ACC-001..006
- SYS-ACC-010
- SYS-ACC-012
- SWR-ACC-001..002

### Applicable ISO criteria

ISO/IEC 27001:2022 and ISO/IEC 27002:2022 apply to protection, access control, integrity and accountability of the ledger information, but **they do not define accounting rules or a chart of accounts**. ISO/IEC 27002 provides security controls and guidance, not accounting standards.

ISO/IEC 25010:2023 supports evaluation of integrity, accountability, authenticity and related software quality properties for the ledger implementation.

ISO 9001 supports controlled process operation, documented information, monitoring and evidence of results.

The actual accounting model remains governed by the applicable accounting framework identified under #286.

### Alternatives considered

**A. Mutable transaction history**

Rejected. It does not provide a sufficiently strong basis for reproducible accounting history.

**B. Immutable economic transaction journal with derived balances**

Partially acceptable but insufficient by itself where multiple accounts/assets must remain balanced.

**C. Double-entry general ledger plus immutable economic transaction provenance**

Selected for design evaluation and implementation planning, subject to the accounting framework identified by #286.

### Selected solution

Design an Accounting and Economic bounded context around:

- immutable economic transaction provenance;
- a chart-of-accounts abstraction appropriate to the selected accounting framework;
- balanced accounting entries;
- explicit debit/credit semantics where double-entry is applicable;
- asset/currency dimensions;
- transaction and entry identifiers;
- source/provider references;
- offer/order/payment references;
- fee and cost components;
- accounting period;
- status lifecycle;
- correlation/idempotency identifiers;
- controlled derivation of balances and statements.

A business operation may produce both an audit event and accounting entries, but those records remain distinct.

### Why?

Because economic history must be reproducible and mathematically coherent, not merely descriptive.

### Purpose?

To produce reliable balances, statements, P&L and period closes from a controlled economic history.

### Impact

**Technical:** adds ledger domain model, account model, entry validation, persistence and reporting projections.

**Functional:** BUY, SELL, transfer, fee, income, expense, gain/loss and correction flows must define economic effects.

**Financial:** incorrect entries can materially misstate balances and P&L.

**Security:** ledger mutation and adjustment privileges require strict authorization and auditability.

### Required tests

- balanced-entry invariant;
- asset/currency correctness;
- BUY/SELL direction correctness;
- fee treatment;
- gain/loss calculation;
- idempotency;
- duplicate-event prevention;
- failed/pending/rejected lifecycle;
- reversal/correction behavior;
- balance derivation;
- statement reproducibility;
- period-boundary behavior;
- concurrency;
- reconciliation against external references.

### Required documentation

- accounting domain glossary;
- chart-of-accounts decision;
- entry model;
- economic-event catalog;
- accounting-policy mapping;
- balance and P&L calculation specification;
- reconciliation rules;
- period-close procedure.

### Verification evidence

Required evidence includes deterministic ledger tests, independent recalculation of representative periods, migration evidence, production-safe sample data, reconciliation evidence and traceability from economic operation to ledger entries and audit events.

### Certification gate

Blocked until #286 identifies the applicable accounting framework and all accounting-specific requirements are mapped to authoritative sources.

---

## 3. Solution Card — Period Close, Immutable History and Controlled Corrections

### Problem / finding

Accounting reports become unreliable if closed periods can be modified directly or historical transactions are overwritten.

### Objective evidence

SYS-ACC-007, SYS-ACC-008 and SYS-ACC-012 require controlled close, immutable closed periods, adjustments/reversals and reproducible reporting.

### Risk / impact

Uncontrolled historical mutation can cause:

- inconsistent financial statements;
- non-reproducible closes;
- unexplained balance changes;
- loss of evidence;
- reconciliation divergence.

### Applicable ISO criteria

ISO/IEC 27002:2022 controls for records, access rights and logging are relevant to protecting closed-period information and controlling privileged changes.

ISO 9001's documented-information and process-control principles support controlled procedures and retained evidence of results.

The actual definition of a legal/accounting close remains subject to #286.

### Alternatives considered

**A. Allow edits to closed records**

Rejected.

**B. Delete and recreate corrected transactions**

Rejected as the normal mechanism because it destroys historical provenance.

**C. Immutable close plus controlled adjustment/reversal entries**

Selected.

### Selected solution

Implement period lifecycle:

**Open → Closing → Reconciled → Closed**

Closed periods reject ordinary mutation. Corrections create new controlled entries linked to the original entry and the reason/authority for the correction.

### Why?

To preserve a reproducible historical record.

### Purpose?

To ensure that a report generated after close can be reconstructed from the same underlying evidence.

### Required tests

- close preconditions;
- reconciliation gate;
- rejection of mutation after close;
- authorized adjustment;
- reversal linkage;
- reopening policy, if legally permitted;
- reproducibility before/after reporting;
- concurrent close protection.

### Required documentation

- close checklist;
- authorization matrix;
- adjustment/reversal policy;
- reopening policy;
- evidence package definition.

### Certification gate

No certification until the accounting framework and legal retention requirements are established under #286.

---

## 4. Solution Card — Reconciliation and Reproducible Reporting

### Problem / finding

Internal economic records must be compared with QvaPay, bank/payment evidence and other external sources without overwriting internal history.

### Objective evidence

SYS-ACC-004, SYS-ACC-009 and SYS-ACC-012 require external provenance, reconciliation and reproducible reporting.

### Applicable ISO criteria

ISO/IEC 27002:2022 is applicable to protecting external evidence and controlling access to reconciliation data. ISO 9001 supports monitored processes, documented information and evidence-based evaluation.

ISO 19011:2026 is relevant as audit guidance for verifiable evidence and structured evaluation, not as an accounting rule.

### Alternatives considered

**A. Overwrite internal records with provider state**

Rejected.

**B. Reconcile manually without persistent evidence**

Rejected.

**C. Preserve both internal ledger history and external evidence, with explicit reconciliation records**

Selected.

### Selected solution

Create a Reconciliation and Reporting bounded context that stores:

- reconciliation run identity;
- source and source timestamp;
- internal reference;
- external/provider reference;
- expected value;
- observed value;
- difference;
- classification;
- resolution status;
- resolution actor;
- resolution evidence;
- report/close linkage.

Reconciliation may identify differences but must not silently rewrite the ledger.

### Why?

Because reconciliation is a comparison process, not a replacement of historical truth.

### Purpose?

To detect, classify, resolve and evidence economic differences.

### Required tests

- exact match;
- amount mismatch;
- missing internal record;
- missing external record;
- duplicate external reference;
- delayed provider state;
- retry/idempotency;
- resolution authorization;
- report reproducibility.

---

## 5. Solution Card — Payment Instrument and Sensitive Data Minimization

### Problem / finding

Accounting requirements include bank-card/payment-method references, but storing full payment credentials would create unnecessary security and privacy exposure.

### Objective evidence

SYS-AUD-008 and SYS-ACC-011 explicitly prohibit storage of full PAN, CVV, PIN and authentication secrets merely for accounting.

### Applicable ISO criteria

ISO/IEC 27002:2022 provides security controls for access control, information classification, protection of records and privacy/security-related information handling.

ISO/IEC 27001:2022 provides the ISMS requirements within which applicable information-security risks are managed.

ISO/IEC 25010:2023 supports evaluation of confidentiality, integrity and accountability as product-quality properties.

### Alternatives considered

**A. Store full payment credentials**

Rejected.

**B. Store only a provider/reference identifier plus masked metadata**

Selected.

**C. Store encrypted full credentials in the application**

Rejected unless a separate, legally and technically justified payment-card scope is established.

### Selected solution

Persist only the minimum information required for accounting and reconciliation, such as:

- payment-method type;
- provider/reference ID;
- masked identifier;
- last-four only where justified;
- bank/reference metadata necessary for reconciliation;
- timestamps and transaction references.

Authentication secrets and card security codes remain outside the accounting domain.

### Why?

To reduce attack surface and prevent the accounting system from becoming an unnecessary credential repository.

### Purpose?

To preserve accounting traceability without retaining sensitive payment secrets.

### Required tests

- secret scanning;
- API response minimization;
- database-field allowlist;
- authorization tests;
- export redaction;
- log/audit redaction;
- negative tests for PAN/CVV/PIN/token persistence.

---

## 6. Solution Card — Accounting and Regulatory Applicability

### Problem / finding

ISO standards can govern security, quality, lifecycle and auditability, but they do not establish the accounting rules, tax treatment or legal reporting obligations for this system.

### Objective evidence

#286 explicitly requires jurisdiction, accounting framework, tax requirements, financial/payment regulations, retention, privacy and treatment of digital assets/stablecoins/fiat to be identified before accounting certification.

### Applicable ISO criteria

ISO 9001 supports determination of organizational context, relevant requirements, controlled processes and evaluation of performance, but it does not replace statutory accounting or tax law.

ISO/IEC 27001/27002 support information-security risk and control requirements but are not accounting standards.

### Selected solution

Create a regulatory applicability matrix:

**legal/accounting requirement → authoritative source → jurisdiction → system requirement → control → implementation → test → evidence → certification status**

The matrix must identify, at minimum:

- jurisdiction(s);
- legal entity and operating model;
- accounting framework;
- tax treatment;
- financial/payment obligations;
- digital-asset/stablecoin/fiat treatment;
- record-retention requirements;
- privacy/data-protection obligations;
- reporting obligations;
- audit requirements.

### Why?

Because software correctness cannot establish legal accounting conformity.

### Purpose?

To prevent certification of accounting outputs against the wrong legal or accounting framework.

### Certification gate

**Blocked.** No accounting report is to be marked Certified until #286 is resolved with an authoritative framework and applicable requirements.

---

## 7. Solution Card — Architecture for Audit, Accounting and Reconciliation

### Problem / finding

Audit evidence, economic history and reconciliation serve different purposes and must not become one mutable data structure.

### Objective evidence

#285 establishes three bounded contexts:

1. Audit and Control.
2. Accounting and Economic.
3. Reconciliation and Reporting.

### Applicable ISO criteria

ISO/IEC 25010:2023 is relevant to architecture quality through characteristics used for software specification and evaluation, including integrity, accountability and maintainability-related properties.

ISO/IEC 27002:2022 supports controlled access, segregation and protection of information assets.

ISO 9001 supports controlled processes, defined interfaces, documented information and measurement.

### Alternatives considered

**A. One shared transaction/audit table**

Rejected.

**B. Separate tables with no domain boundaries**

Rejected as insufficient architectural governance.

**C. Separate bounded contexts with explicit ports and traceability**

Selected.

### Selected target

```text
QvaPay-AI
├── Authentication & Authorization
├── Account
├── Market
├── Scanner
├── Arbitrage
├── Administration
├── Audit & Control
├── Accounting & Economic
└── Reconciliation & Reporting
```

Cross-context correlation is allowed, but data ownership remains explicit.

A SELL, for example, may create:

- one or more Audit events;
- one or more Accounting entries;
- one or more Reconciliation records later.

None of these replaces the others.

### Why?

To prevent coupling between security evidence, economic truth and external comparison state.

### Purpose?

To provide a controlled architecture that can evolve without corrupting historical evidence.

### Required tests

- domain dependency checks;
- port/adapter boundary checks;
- no Cloudflare/D1/browser dependency in domain;
- no direct infrastructure dependency from application domain rules;
- cross-context correlation;
- failure isolation;
- migration compatibility.

---

## 8. Consolidated decision

The selected design direction is:

- **Dedicated Audit and Control capability** for operational/security evidence.
- **Double-entry-capable Accounting and Economic capability** for economic truth, subject to the applicable accounting framework.
- **Dedicated Reconciliation and Reporting capability** for comparison with external evidence.
- **Immutable historical records with controlled adjustments/reversals.**
- **Strict sensitive-data minimization.**
- **Explicit cross-context correlation without merging the data models.**
- **Accounting certification blocked until jurisdiction and accounting framework are established.**

These decisions are design decisions only. They do not authorize runtime implementation.

## 9. Authorization and implementation gate

Before implementation begins, the following must be true:

1. PR #288 has established the requirements baseline.
2. These solution cards are reviewed against #270.
3. Applicable ISO criteria are accepted as substantive mappings.
4. #286 identifies the accounting/regulatory authority.
5. Implementation Issues and PRs are created from the approved cards.
6. Each implementation PR links the applicable card and requirement IDs.
7. Tests and objective evidence are defined before code is merged.
8. Verification and certification remain separate from implementation.

## 10. Certification rule

A capability may progress through:

**Defined → Designed → Implemented → Tested → Verified → Certified**

A successful CI run, deployment, or working demonstration is not certification.

Only a complete evidence chain may enter the Certified Functional Baseline.
