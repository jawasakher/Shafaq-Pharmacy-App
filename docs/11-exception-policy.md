# 11 — Exception Policy

## 1. Purpose

This document defines how Shafaq handles business exceptions, failures, conflicts, and unresolved states without silently breaking the normal state machines.

It is consistent with:

- SRS v1.2
- Decision Log
- Permission Matrix
- State Transition Matrix
- ERD
- OpenAPI contract
- Payment Contract
- Delivery Pricing Contract
- Authentication Policy
- Retention Policy
- Concurrency Test Plan

The core rule is:

> An exception must produce an explicit, auditable, recoverable state. The system must never hide a business failure by silently forcing an unrelated successful state.

---

## 2. Exception Categories

Exceptions are classified as:

1. validation exceptions;
2. authorization/security exceptions;
3. business-state conflicts;
4. payment/provider exceptions;
5. delivery exceptions;
6. cash exceptions;
7. pharmacy/assignment exceptions;
8. consultation exceptions;
9. infrastructure/technical exceptions;
10. administrative exceptions;
11. data-integrity exceptions.

Each category has its own handling boundary.

---

## 3. General Exception Rules

Every exception must:

- preserve database integrity;
- avoid partial business transitions;
- return a stable API error/result where appropriate;
- include a requestId/correlation identifier;
- avoid exposing secrets or unnecessary sensitive information;
- be observable;
- be retryable only when retry is safe;
- preserve an explicit unresolved state when the final outcome is unknown.

The backend must never convert an unknown result into success or failure merely to simplify the UI.

---

## 4. Validation Exceptions

Examples:

- invalid phone number;
- invalid coordinates;
- missing required medicine;
- invalid quantity;
- unsupported delivery destination;
- malformed prescription metadata.

Validation failures must occur before irreversible business effects.

They must not create:

- paid orders;
- active deliveries;
- successful payment records;
- false audit events.

---

## 5. Authentication and Authorization Exceptions

Authentication failures include:

- invalid/expired OTP;
- missing authentication;
- expired/revoked session;
- MFA failure.

Authorization failures include:

- wrong role;
- missing pharmacy membership;
- inactive membership;
- suspended pharmacy;
- unapproved driver;
- access to another user's resource;
- access to an unassigned consultation.

These failures must not reveal sensitive resource information.

---

## 6. State Conflict Exceptions

A state conflict occurs when the requested operation was valid when initiated but the resource has changed before the request can commit.

Examples:

- order already changed state;
- pharmacy assignment no longer active;
- driver delivery already accepted;
- payment already completed;
- OTP already consumed.

The backend should return a deterministic conflict response or an idempotent result when the repeated operation represents the same logical action.

It must never overwrite the newer valid state without an explicit transition rule.

---

## 7. Order Exceptions

Order exceptions must respect the order state machine.

### Unavailable medicine and complete-order handling

The requested order is always handled as one complete unit.

If any requested medicine is unavailable:

- the pharmacy must not transition the order directly to `PHARMACY_CONFIRMED`;
- partial fulfillment is not supported;
- unavailable `OrderItem` records remain in the original order;
- the customer cannot confirm only the available medicines;
- the current pharmacy may reject or request transfer of the complete order;
- a receiving pharmacy receives and reviews the complete original order;
- the receiving pharmacy must explicitly accept before becoming `ACTIVE` and
	responsible;
- if no eligible pharmacy accepts, the order follows the existing
	`PHARMACY_REVIEWING -> CLOSED` outcome;
- no `ALL_UNAVAILABLE` or other new `OrderStatus` may be invented;
- `medicineSubtotal` is finalized only after complete-order fulfillment is
	confirmed.
- `OrderItem.totalPrice` is calculated by the backend as `quantity × unitPrice`.
- `medicineSubtotal` is calculated by the backend as the sum of all persisted
  `OrderItem.totalPrice` values.
- `totalAmount` is calculated by the backend as
  `medicineSubtotal + deliveryFee`.
- Client-supplied subtotal and delivery-fee values are never authoritative.

Examples:

- pharmacy rejects/does not have requested medicine;
- customer rejects final price;
- transfer required;
- pharmacy becomes unavailable;
- payment cannot be completed;
- delivery cannot be assigned.

The system must transition to the explicit state defined by the business rules.

It must not invent ad-hoc statuses such as `BROKEN`, `FAILED_ORDER`, or `CANCELLED_BY_SYSTEM` unless those states are formally added to the SRS and state matrix.

---

## 8. Pharmacy Transfer Exceptions

A transfer is not complete merely because a transfer was requested.

The original `Order.pharmacyId` is immutable and remains the pharmacy selected
by the customer at order creation. Transfer must never rewrite it. The current
responsible pharmacy is resolved only through the single `ACTIVE`
`PharmacyAssignment`.

The candidate pharmacy must explicitly accept/reject according to the transfer workflow.

If the candidate rejects or the offer expires:

- the previous responsible-pharmacy state remains governed by the state machine;
- no duplicate active assignment may exist;
- the order must follow the approved next transition.

If no valid pharmacy can accept, the system must use an explicit business outcome defined by the order workflow rather than silently assigning a pharmacy.

---

## 9. Payment Exceptions

Payment failures must distinguish between known failure and unknown outcome.

### Known Failure

If the backend/provider has authoritative evidence that the payment failed:

- payment may transition to `FAILED`;
- the order follows the approved payment-failure path.

### Unknown Outcome

If the backend cannot determine whether the provider processed the payment:

- payment must become/remain `UNKNOWN`;
- the system must not create a second charge blindly;
- reconciliation must be attempted according to the payment contract.

UNKNOWN is not equivalent to FAILED.

---

## 10. Payment Timeout

A provider timeout does not automatically mean payment failure.

The implementation must determine whether the provider response is:

- definitively failed;
- definitively successful;
- unknown.

If unknown:

1. persist UNKNOWN;
2. prevent unsafe duplicate charging;
3. schedule or trigger reconciliation;
4. update the payment only after authoritative evidence.

The customer-facing UI must not falsely claim success or failure when the outcome is unresolved.

---

## 11. Duplicate Payment Requests

Duplicate payment attempts must be controlled by idempotency.

For the same logical payment operation:

- repeated requests with the same valid idempotency key must not create duplicate charges;
- requests with conflicting idempotency data must be rejected;
- a second payment must not bypass the order's payment state.

---

## 12. Webhook Exceptions

Webhook processing must be idempotent.

For duplicate webhook events:

- process once;
- record event identity;
- return a safe repeated result.

For out-of-order events:

- validate the event against the current payment state;
- do not blindly move the payment backward;
- preserve UNKNOWN when authoritative outcome is still unresolved.

Webhook authentication/signature verification must be enforced according to the provider contract once officially documented.

No provider-specific signature scheme should be invented.

---

## 13. Delivery Exceptions

Delivery exceptions include:

- no eligible driver;
- driver becomes unavailable;
- driver fails to arrive;
- handover cannot be completed;
- pickup cannot be confirmed;
- delivery OTP fails;
- customer unavailable;
- cash cannot be collected.

The system must use explicit exception handling without allowing drivers to arbitrarily cancel active deliveries.

Any new delivery terminal/exception state must be formally approved and added to the state matrix before implementation.

---

## 14. No Eligible Driver

If no eligible driver can be assigned:

- delivery remains in an appropriate searching/unassigned state;
- the system may retry assignment according to configured policy;
- customer-facing status must remain truthful;
- the order must not become DELIVERED or COMPLETED.

No fake driver assignment may be created.

---

## 15. Driver Failure During Delivery

If a driver becomes unavailable or a delivery operation fails after assignment:

- preserve the authoritative delivery history;
- mark the exception using the approved delivery/exception mechanism;
- do not silently assign a second driver without releasing/transitioning the first assignment according to the state machine;
- prevent two active drivers from owning the same delivery.

Driver BUSY status must remain correct until the approved resolution point.

---

## 16. Delivery OTP Exceptions

Invalid or expired OTP:

- does not deliver the order;
- increments the applicable attempt/rate-limit counters;
- does not invalidate the delivery automatically unless the security policy requires it.

A successfully verified OTP:

- can be consumed once;
- must not be reusable;
- must not permit a second DELIVERED transition.

---

## 17. Cash Exceptions

Cash outcomes are explicit:

- `NOT_DUE`
- `DUE`
- `RECEIVED`
- `UNPAID`
- `PARTIALLY_PAID`
- `DISPUTED`

If cash is unpaid:

- the order must not be treated as financially completed;
- the delivery/driver exception remains unresolved as required;
- driver BUSY status remains until the approved resolution point;
- the event must be auditable.

Cash discrepancies must not be silently rounded away or overwritten.

---

## 18. DELIVERED vs COMPLETED

A successful delivery event does not automatically mean the order is fully completed.

The system must preserve the distinction:

- `DELIVERED` = physical delivery milestone completed;
- `COMPLETED` = all required financial/business completion conditions satisfied.

Cash and other required completion conditions must be resolved before final completion.

---

## 19. Consultation Exceptions

Consultation exceptions include:

- no pharmacist available;
- pharmacist assignment failure;
- customer inactivity/expiry;
- cancellation according to allowed rules;
- technical messaging failure.

Consultation content remains private even during exception handling.

Admin support workflows must not require reading the private chat.

If a consultation expires/cancels, its messages remain subject to the retention policy.

---

## 20. Prescription Exceptions

Prescription failures include:

- upload failure;
- unsupported file;
- invalid metadata;
- signed URL failure;
- deletion/version conflict.

A failed upload must not create an authoritative prescription version.

A deleted or superseded prescription must not remain publicly accessible through an old signed URL.

The system must preserve version consistency.

---

## 21. Infrastructure Exceptions

Technical failures include:

- database unavailable;
- network timeout;
- external service timeout;
- application process restart;
- queue failure;
- object storage failure.

Infrastructure failure must not produce false business success.

Transactions must roll back where appropriate.

Retry only when the operation is known to be safe or protected by idempotency.

---

## 22. Partial Failure Rule

If an operation requires multiple side effects and one required side effect fails, the system must either:

- roll back the transaction; or
- persist an explicit recoverable intermediate/unresolved state.

It must never report the whole business operation as successful while silently losing a required side effect.

---

## 23. Retry Policy

Retries must be classified:

### Safe Retry

Operations protected by idempotency or guaranteed read-only behavior.

### Conditional Retry

Operations where retry safety depends on the current state and must be revalidated.

### Unsafe Retry

Operations that may duplicate an external side effect unless reconciliation/idempotency protection exists.

The system must never blindly retry an unknown payment charge.

---

## 24. Customer-Facing Error Messages

Customer messages should be:

- truthful;
- concise;
- actionable;
- free of internal stack traces;
- free of secrets;
- free of provider internals that do not help the customer.

Examples of appropriate categories:

- "تعذر إتمام العملية، حاول مرة أخرى."
- "الطلب قيد التحقق من حالة الدفع."
- "الصيدلية لم تعد متاحة لهذا الطلب."
- "تعذر تأكيد التسليم، يرجى المحاولة مرة أخرى."

The exact final Arabic UX copy belongs to the frontend/API contract review.

---

## 25. Internal Error Details

Detailed technical information belongs in controlled logs/observability, not public responses.

Internal logs may contain:

- error category;
- requestId;
- resource identifiers;
- safe provider reference;
- transaction outcome;
- retry/reconciliation status.

Never log:

- OTPs;
- passwords;
- tokens;
- MFA secrets;
- private consultation messages;
- prescription contents.

---

## 26. Administrative Exception Handling

Admin may resolve operational exceptions only through explicit permissions and documented actions.

Admin actions must not silently rewrite historical:

- payment records;
- delivery pricing snapshots;
- consultation content;
- state history.

Where an override is necessary, it must be an explicit exception action with:

- reason;
- actor;
- timestamp;
- affected resource;
- resulting state.

If the required override does not exist in the state machine, the state machine must be updated before implementation.

---

## 27. Exception Auditability

Important exception events must be auditable.

Examples:

- payment UNKNOWN/reconciliation;
- cash dispute;
- driver assignment failure;
- pharmacy transfer rejection/expiry;
- security lockout;
- administrative override;
- delivery exception.

Audit records must describe the event without copying private medical content.

---

## 28. Monitoring and Alerts

Production monitoring should identify:

- growing UNKNOWN payments;
- repeated payment reconciliation failures;
- repeated delivery assignment failures;
- abnormal OTP failures;
- cash disputes;
- stuck orders/deliveries;
- repeated state-conflict errors;
- failed retention jobs;
- failed critical background jobs.

Alerts should focus on conditions requiring intervention, not every ordinary user error.

---

## 29. Exception Recovery

Every recoverable exception must have a defined recovery owner and mechanism.

Possible mechanisms include:

- automatic retry;
- scheduled reconciliation;
- state-machine retry;
- customer retry;
- pharmacy action;
- driver action;
- admin operational resolution.

The recovery mechanism must be safe to repeat.

---

## 30. Required Tests

Test at least:

- invalid input;
- unauthorized action;
- state conflict;
- duplicate request;
- payment UNKNOWN;
- payment reconciliation;
- duplicate webhook;
- out-of-order webhook;
- no eligible driver;
- driver failure;
- invalid delivery OTP;
- duplicate delivery OTP;
- unpaid cash;
- partial cash;
- disputed cash;
- consultation expiry;
- prescription upload failure;
- database timeout;
- provider timeout;
- retry after timeout;
- partial transaction failure;
- administrative exception action.

---

## 31. Implementation Sequence

1. Define domain error categories.
2. Map each error to a state-machine outcome.
3. Implement transactional rollback boundaries.
4. Implement idempotency/reconciliation.
5. Implement delivery/cash exception handling.
6. Implement payment exception handling.
7. Implement security exception handling.
8. Implement operational/admin exception actions.
9. Add audit events.
10. Add monitoring and alerts.
11. Run exception and failure-injection tests.

---

## 32. Change Policy

Any new exception state, terminal state, retry rule, payment failure rule, delivery failure rule, cash rule, or administrative override must be reviewed against:

- SRS;
- Decision Log;
- State Transition Matrix;
- ERD;
- OpenAPI;
- Payment Contract;
- Delivery Pricing Contract;
- Authentication Policy;
- Concurrency Test Plan;
- affected tests.

No undocumented ad-hoc state should be introduced in code.

---

## 33. Final Principle

> Exceptions are part of the domain, not an afterthought: every failure or unknown outcome must remain explicit, auditable, recoverable where possible, and consistent with the authoritative state machines.
