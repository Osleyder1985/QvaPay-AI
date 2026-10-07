# Accounting and Economic — System Functional Requirements

## Purpose
Define the baseline for a controlled economic ledger capable of reconstructing economic effects and producing reproducible period closes.

## Governance status
**Defined / Blocked for implementation.** Implementation is gated by #270 and #271.

## ACC-FR-001 — Economic transaction capture
The system SHALL record economically relevant deposits, withdrawals, BUY, SELL, transfers, commissions, fees, income, expenses, gains, losses, conversions, authorized adjustments, reversals/corrections, and economically relevant pending/failed/rejected/reconciled states.

## ACC-FR-002 — Transaction provenance
Each transaction SHALL preserve, as applicable: transaction ID; user/account; source/provider; internal/external identifiers; type/direction; asset/currency; market; quantity; unit price/rate; gross amount; fees/costs; net amount; counterparty/offer reference; payment method reference; timestamps; status lifecycle; correlation/idempotency identifiers; accounting period; source evidence; reconciliation state.

## ACC-FR-003 — Monetary precision
Amounts, rates, fees, balances, and quantities SHALL use explicit decimal representation and currency-specific precision policy. Binary floating point MUST NOT be the accounting source of truth.

## ACC-FR-004 — Ledger model
The design SHALL evaluate a double-entry/general-ledger model. Where selected, each posted economic event SHALL produce balanced accounting entries.

## ACC-FR-005 — Immutable accounting history
Posted entries SHALL NOT be retroactively overwritten. Corrections SHALL use controlled adjustment, reversal, or compensating entries.

## ACC-FR-006 — Accounting periods
The system SHALL support opening balance, posted activity, adjustments, reconciliation status, closing balance, close authorization, close timestamp, and close evidence. Closed periods SHALL be immutable except through governed reopening.

## ACC-FR-007 — Statements
The system SHALL support account statements sufficient to reconstruct activity for a selected period and account/currency.

## ACC-FR-008 — Income, expense, gain and loss
The system SHALL classify economic effects to produce income, expenses, realized gains, realized losses, fees, and net result. Treatment of unrealized gains/losses SHALL follow the applicable accounting framework.

## ACC-FR-009 — Reconciliation
The system SHALL reconcile internal records with authoritative external sources such as QvaPay and applicable banking/payment sources, preserving matched, unmatched, amount mismatch, currency mismatch, duplicate, timing/pending, fee mismatch, and exception states without overwriting history.

## ACC-FR-010 — Payment instruments
The system SHALL use minimized payment-instrument references. Full PAN, CVV, PIN, authentication secrets, and equivalent sensitive credentials MUST NOT be stored for accounting purposes.

## ACC-FR-011 — Closing
A close SHALL record period, preparer, reviewer/authorizer, opening/closing balances, revenue, expenses, gains/losses, reconciliation exceptions, adjustments, evidence references, timestamp, and status.

## ACC-FR-012 — Reports
Subject to the applicable accounting framework, the system SHALL support transaction ledger, account statement, income/expense, profit/loss, balance, reconciliation, and period-close reporting.

## ACC-FR-013 — Separation from Audit
Accounting records and audit records SHALL remain distinct bounded concerns. One operation MAY produce both, but neither substitutes for the other.

## Certification prerequisites
Certification requires decimal correctness, ledger balancing, immutable corrections, period close controls, reconciliation, payment-data minimization, reproducible statements/reports, idempotency/concurrency evidence, production evidence, and applicable accounting/regulatory conformity.
