# 09 — Retention Policy

## 1. Purpose

This document defines Shafaq's retention and deletion principles for operational, financial, security, medical, communication, and audit data.

The policy must remain consistent with:

- SRS v1.2
- Decision Log
- Permission Matrix
- State Transition Matrix
- ERD
- OpenAPI contract
- Payment Contract
- Delivery Pricing Contract
- Authentication Policy

The core rule is:

> Retain data only for as long as required for the product, security, legal, financial, operational, or audit purpose for which it exists, and delete or anonymize it when that purpose no longer requires identifiable retention.

Exact statutory retention periods must be confirmed against the applicable jurisdiction before production launch. This document does not invent legal requirements.

---

## 2. Retention Categories

Shafaq data is classified into:

- identity/account data;
- addresses and location data;
- pharmacy and membership data;
- order and fulfillment data;
- prescription/medical data;
- payment and financial records;
- delivery and cash records;
- consultation content;
- notifications;
- security/authentication records;
- audit logs;
- pricing snapshots;
- operational/technical logs.

Each category must have an explicit retention decision.

---

## 3. Identity and Account Data

Customer and internal-user account data must be retained while the account is active or while a legitimate operational/legal need requires it.

Account deletion must not automatically destroy records that are required to preserve:

- financial integrity;
- order history;
- auditability;
- fraud/security investigations;
- legal obligations.

Where an account must be removed while historical records must remain, the system should use controlled anonymization/pseudonymization where appropriate.

---

## 4. Addresses and Location Data

Saved customer addresses are user-owned application data.

When an address is deleted by the customer, it should no longer be available as an active address.

Historical order delivery information must not depend on the customer's current address record.

Orders must preserve the delivery-address snapshot required for historical fulfillment and financial/audit purposes.

Live or transient location data must not be retained indefinitely merely because it was technically available.

---

## 5. Pharmacy and Membership Data

Pharmacy records must be retained while the pharmacy is active and for as long as historical order, financial, audit, or legal records require identification of the responsible pharmacy.

Pharmacy memberships must preserve sufficient historical information to understand past authorization and responsibility.

Inactive memberships must not grant current access.

Historical membership records should not be physically deleted if doing so would destroy required auditability.

---

## 6. Order and Fulfillment Data

Orders are core business records.

An order must be retained for the period required for:

- customer history;
- operational support;
- financial reconciliation;
- dispute handling;
- fraud/security investigation;
- audit requirements;
- applicable legal obligations.

Completed orders must not be physically deleted merely because they are no longer visible in the normal customer UI.

Historical state changes and important business events should remain auditable according to the audit policy.

---

## 7. Prescription and Medical Data

Prescription images and related medical information are sensitive data.

The system must retain prescription data only for the minimum period necessary for:

- fulfilling the associated order;
- pharmacist workflow;
- customer access where explicitly required;
- dispute/support handling where necessary;
- applicable legal obligations.

Prescription files must not be retained indefinitely by default.

Deletion must account for all stored versions and derived copies where applicable.

Access to retained prescription data remains subject to the permission/privacy model.

Signed temporary URLs must expire and must not become permanent public access paths.

---

## 8. Consultation Data

Consultation content is private medical/health-related communication and requires strict retention minimization.

Consultation messages must be retained only for the period required by the approved product/legal policy.

Admin users must not gain consultation-content access merely because content remains retained.

When consultation content reaches its retention limit, the system must delete or anonymize it according to the approved policy without destroying unrelated operational records.

Consultation metadata may require a different retention period from message content.

---

## 9. Payment and Financial Records

Payment records require retention sufficient for:

- payment reconciliation;
- provider dispute handling;
- financial reporting;
- fraud investigation;
- refunds/exceptions where explicitly allowed;
- applicable legal/accounting obligations.

Payment records must not be deleted solely because an order is no longer active.

Provider webhook/event records required for idempotency and reconciliation must be retained for the approved financial/audit period.

Sensitive payment credentials must never be retained unless explicitly required and securely supported by the selected provider architecture.

Sham Cash provider-specific retention requirements must be verified from official documentation before production integration.

---

## 10. Delivery and Cash Records

Delivery records should be retained sufficiently to support:

- order fulfillment history;
- driver assignment history;
- handover verification;
- delivery OTP verification history where required;
- cash reconciliation;
- disputes and exceptions;
- operational auditing.

Cash transaction records must not be deleted while they are unresolved.

After resolution, retention follows the financial/operational retention policy.

The system should avoid retaining unnecessary precise driver/customer location history.

---

## 11. Delivery Pricing Snapshots

Delivery-pricing snapshots are historical business records.

A snapshot associated with an order must remain available for as long as necessary to reproduce:

- the delivery fee;
- the order total;
- the payment amount;
- financial reconciliation;
- audit decisions.

Changing the active pricing configuration must not rewrite historical snapshots.

---

## 12. Authentication and Security Records

Security-sensitive records should be retained according to their purpose.

Examples:

- OTP records: retain only as long as needed for verification, abuse prevention, or security investigation;
- active/revoked sessions: retain only as required by the session design;
- security events: retain according to security-monitoring needs;
- MFA/security events: retain according to security and audit requirements.

Plaintext secrets must never be retained.

Expired OTPs and unusable authentication secrets should be removed or rendered inaccessible according to the implementation.

---

## 13. Audit Logs

Audit logs provide historical evidence of important system actions.

Audit logs should retain events such as:

- pharmacy approval/rejection/suspension;
- membership changes;
- important order state transitions;
- pharmacy transfers;
- payment state changes;
- delivery assignment and handover events;
- cash resolution;
- administrative security actions;
- permission-sensitive changes.

Audit logs must avoid unnecessary sensitive payloads.

Consultation message content must not be copied into audit logs.

Audit retention must satisfy applicable operational, security, financial, and legal requirements.

---

## 14. Notifications

Notifications are user-facing communication records.

The system should retain only the history needed for:

- in-app notification display;
- operational support;
- security/transactional evidence where required.

Notification retention must not become an uncontrolled duplicate store of medical or financial information.

Sensitive message content should be minimized.

---

## 15. Application and Infrastructure Logs

Technical logs must follow data minimization.

Do not log:

- OTP values;
- passwords;
- access tokens;
- refresh tokens;
- MFA secrets;
- full prescription contents;
- consultation messages;
- unnecessary payment credentials;
- unnecessary precise location history.

Logs should use requestId/correlation identifiers.

Application logs should have a shorter operational retention period than core financial/audit records unless a specific security or operational reason requires longer retention.

---

## 16. Backups

Backups inherit the sensitivity of the source data.

Backup retention must be explicitly configured.

When production data reaches deletion/anonymization requirements, the organization must define how deletion propagates to:

- active databases;
- object storage;
- caches where relevant;
- backups according to the backup lifecycle.

A deleted record may remain temporarily in an immutable backup according to the approved backup lifecycle, but it must not be restored into active production without the deletion policy being respected.

---

## 17. Deletion and Anonymization

Deletion must be purpose-aware.

Use physical deletion when the record no longer has a legitimate retention purpose and deletion is safe.

Use anonymization/pseudonymization when historical business integrity requires the record structure but the person's direct identity is no longer required.

Deletion must not break:

- order financial totals;
- payment reconciliation;
- audit integrity;
- state-machine history;
- referential integrity required by retained records.

---

## 18. Legal Holds and Exceptions

If a record is subject to an approved legal, regulatory, financial, fraud, or security hold, normal deletion may be paused for the scope of that hold.

The hold must be:

- explicitly recorded;
- limited in scope;
- reviewed;
- removed when no longer required.

This policy does not itself create a legal hold.

---

## 19. Customer Deletion Requests

A customer deletion request must be processed through a controlled workflow.

The system must determine:

1. which directly identifying data can be deleted;
2. which data must be retained;
3. which records can be anonymized;
4. whether an active order/financial process prevents immediate deletion;
5. whether a legal/security hold applies.

The customer must not be promised complete immediate erasure when the system is legally or operationally required to retain specific records.

---

## 20. Data Minimization

Every new feature must identify:

- what data it creates;
- why it needs the data;
- how long it needs the data;
- who can access it;
- when it can be deleted/anonymized.

A feature must not collect or retain data merely because it might be useful later.

---

## 21. Retention Configuration

Retention periods should be centrally configurable where practical.

They must not be scattered as unrelated constants across controllers and services.

Changes to retention periods must be reviewed for:

- privacy impact;
- legal requirements;
- database behavior;
- object storage;
- backups;
- audit requirements;
- API behavior.

---

## 22. Required Tests

Test at least:

- expired OTP cleanup;
- deleted customer address no longer active;
- historical order snapshot remains valid after address deletion;
- prescription retention/deletion;
- consultation-content retention;
- payment retention;
- unresolved cash record cannot be deleted prematurely;
- audit record integrity;
- deletion/anonymization without breaking retained financial records;
- backup lifecycle behavior;
- retention jobs are idempotent;
- retention jobs do not delete active records.

---

## 23. Implementation Sequence

1. Classify every persisted entity by retention category.
2. Confirm applicable legal/regulatory retention requirements.
3. Define retention periods in configuration.
4. Define deletion/anonymization workflows.
5. Implement scheduled retention jobs.
6. Implement object-storage cleanup for prescriptions.
7. Implement audit/security log retention.
8. Define backup lifecycle.
9. Add retention and deletion tests.
10. Add monitoring for failed retention jobs.

No retention job should run against production until the retention periods are explicitly approved.

---

## 24. Change Policy

Any change to:

- retention period;
- deletion behavior;
- anonymization behavior;
- legal-hold behavior;
- backup retention;
- prescription retention;
- consultation retention;
- payment/audit retention

must be reviewed against the SRS, privacy requirements, ERD, affected APIs, tests, and applicable legal obligations.

---

## 25. Final Principle

> Retain the minimum data needed for an explicit purpose, protect sensitive data for its entire lifecycle, preserve financial and audit integrity, and delete or anonymize identifiable data when its approved retention purpose ends.
