# Audit and Control — System Functional Requirements

## Purpose
Define the functional baseline for a persistent system audit trail that can reconstruct relevant actions and decisions without treating ordinary application logs as the system of record.

## Governance status
**Defined / Blocked for implementation.** Implementation is gated by #270 and #271.

## AUD-FR-001 — Auditable event creation
The system SHALL create an audit event for every security-, identity-, administration-, configuration-, operational-, integration-, and financially-relevant action identified by the approved event classification.

Each event SHALL capture, as applicable: event ID; canonical timestamp; actor type and identity; role/capability context; action; target type and ID; reason/purpose; source channel; previous state; resulting state; outcome; failure/rejection reason; correlation/request/operation identifiers; external/provider reference; non-secret metadata; integrity/provenance metadata; retention and classification metadata.

## AUD-FR-002 — Event lifecycle
Audit events SHALL distinguish attempted, accepted, completed, rejected, failed, and reversed/corrected states where applicable.

## AUD-FR-003 — Before/after integrity
State-changing operations SHALL preserve the approved representation of previous and resulting state. Sensitive values SHALL be redacted, masked, hashed, or represented by stable references according to classification.

## AUD-FR-004 — Actor attribution
The system SHALL distinguish authenticated humans, unauthenticated actors, service identities, scheduled processes, webhooks, provider events, and internal system actions. System events MUST NOT be attributed to a human without explicit causal attribution.

## AUD-FR-005 — Traceability
Events SHALL support reconstruction through correlation, request, operation, idempotency, and external-provider identifiers where available.

## AUD-FR-006 — Access control
Audit records SHALL be readable only by authorized roles/capabilities. Access to audit records SHALL itself be auditable.

## AUD-FR-007 — Retention and integrity
Retention, archival, deletion, legal hold, integrity verification, and evidence export SHALL be governed by documented policy. Unauthorized modification/deletion detection SHALL be defined.

## AUD-FR-008 — Query and evidence
Authorized users SHALL be able to search/filter by date/time, actor, action, target, result, correlation ID, and external reference. Evidence exports SHALL preserve provenance and integrity metadata.

## AUD-FR-009 — Data minimization
Audit records MUST NOT contain passwords, access tokens, CVV/PIN, full payment-card data, or other secrets unless an approved requirement explicitly establishes a lawful and controlled need.

## AUD-FR-010 — Audit the audit system
Administrative actions affecting audit configuration, retention, access, exports, or evidence handling SHALL themselves be auditable.

## Certification prerequisites
Certification requires evidence of event coverage, actor attribution, before/after correctness, redaction, tamper detection, access control, retention, query/export reproducibility, production behavior, and traceability to approved ISO controls.
