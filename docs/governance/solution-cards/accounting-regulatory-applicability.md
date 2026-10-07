# Solution Card — Accounting and Regulatory Applicability

## Status
**Defined / Blocked.**

## Problem
The requested Accounting and Economic module will produce statements, balances, gains/losses, income/expense information, and period closes. Software/security standards do not determine which accounting, tax, financial, payment, or record-retention rules apply to those outputs.

## Evidence
Requirement #286 was created specifically to prevent certification of financial reports against ISO controls alone.

## Risk
If the applicable jurisdiction and accounting framework are not established, the system could produce technically consistent but legally or financially inappropriate reports, retention behavior, classifications, or tax treatment.

## Why
Accounting correctness is jurisdiction- and framework-dependent. The software must implement an explicitly approved accounting basis rather than silently selecting assumptions.

## Purpose
Create a documented applicability boundary before accounting certification.

## Required inputs
The project must identify, before certification:
- legal entity and operating jurisdiction(s) in scope;
- accounting framework;
- tax jurisdiction(s);
- treatment of fiat and digital assets;
- financial/payment regulatory obligations;
- record-retention requirements;
- privacy/data-protection obligations;
- reporting periods and statutory deadlines where applicable;
- external auditor/accounting authority requirements where applicable.

## ISO relationship
ISO/IEC 27001:2022 and ISO/IEC 27002:2022 can support information-security and control requirements. ISO 9001:2026 can support controlled processes and documented information. ISO/IEC/IEEE 12207:2026 can support lifecycle control. These standards do not replace accounting or tax law.

## Proposed solution
Create a regulatory applicability matrix with:

legal/accounting requirement → authoritative source → applicability decision → system requirement → control → implementation → test → evidence → certification status.

No accounting rule is to be inferred solely from software conventions.

## Tests and evidence
Before certification, evidence must demonstrate that every implemented accounting rule traces to an approved accounting/regulatory requirement or an explicitly documented accounting policy approved by the responsible authority.

## Gate
**No accounting certification until the applicability matrix is approved.**
