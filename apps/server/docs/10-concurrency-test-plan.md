# 10 — Concurrency Test Plan

## 1. Purpose

This document defines the concurrency and race-condition test plan for Shafaq.

The purpose is to prove that simultaneous requests cannot violate the SRS state machines, database constraints, authorization rules, payment integrity, delivery assignment rules, or historical pricing guarantees.

The core rule is:

> Every business transition must remain correct when multiple valid requests arrive at the same time.

Concurrency correctness is a backend responsibility. Frontend disabling, button state, or client timing must never be treated as a concurrency control.

---

## 2. Concurrency Threat Model

Important race conditions include:

- two users changing the same business state;
- duplicate customer submissions;
- duplicate payment requests;
- duplicate provider webhooks;
- two drivers accepting the same delivery;
- two pharmacy actions competing for one order;
- pharmacy transfer racing with confirmation/payment;
- cash resolution racing with another exception action;
- consultation assignment races;
- pricing changes racing with order/payment creation;
- duplicate OTP verification.

---

## 3. Required Database Guarantees

The implementation must use appropriate database constraints and transactions.

Where applicable, enforce:

- unique identifiers;
- unique active membership rules;
- one active pharmacy assignment per order;
- one active delivery per order;
- one active delivery per driver;
- unique payment idempotency keys;
- unique provider webhook event identifiers;
- unique active consultation per customer;
- one valid/latest active OTP;
- valid foreign-key relationships.

Application checks alone are insufficient where a database constraint can enforce the invariant.

---

## 4. Transaction Boundary

A transaction must contain all changes that must succeed or fail together.

Examples:

### Pharmacy Confirmation

The order state change, authoritative pharmacy assignment update, and relevant pricing/payment boundary data must be committed consistently.

### Driver Acceptance

The system must atomically verify that the delivery is still available and assign it to the winning driver.

### Payment

Payment creation and idempotency handling must prevent duplicate payable records for the same logical payment attempt.

### Cash Resolution

Cash state and related order/delivery state changes must not become contradictory.

---

## 5. Isolation and Locking

The implementation must select the lowest database isolation/locking mechanism that safely enforces each invariant.

Possible techniques include:

- row-level locks;
- conditional updates;
- unique constraints;
- serializable transactions where necessary;
- optimistic concurrency/version checks.

Do not use serializable isolation everywhere without reason.

Each critical invariant should document why its selected concurrency strategy is sufficient.

---

## 6. Idempotency

Operations that may be retried must be idempotent where appropriate.

Required candidates include:

- order submission;
- payment creation;
- payment provider webhook processing;
- delivery acceptance;
- OTP verification where retry semantics require it;
- cash confirmation;
- important administrative transitions.

A repeated request must not create duplicate business effects.

Idempotency keys must be scoped correctly and stored durably for the required period.

---

## 7. Pharmacy Assignment Races

### Test A — Two Acceptances

Two eligible pharmacy actions attempt to make competing assignments active at the same time.

Expected:

- only one assignment becomes active;
- the other request receives a deterministic conflict/result;
- the order remains in a valid state.

### Test B — Transfer Race

The current pharmacy and a candidate transfer pharmacy act concurrently.

Expected:

- no two active assignments;
- transfer acceptance follows the state machine;
- no stale pharmacy remains active after a successful transfer.

### Test C — Assignment Expiry Race

An offer expires while an acceptance request arrives.

Expected:

- exactly one outcome according to transaction ordering;
- an expired offer cannot become active after its expiry boundary.

---

## 8. Driver Acceptance Race

This is a critical invariant.

Multiple approved/available drivers may attempt to accept the same offered delivery simultaneously.

Expected:

- first valid acceptance wins according to the backend transaction;
- exactly one `DRIVER_ASSIGNED` result;
- exactly one active delivery/driver relationship;
- losing drivers receive a non-success conflict/availability result;
- no driver remains incorrectly marked BUSY.

The result must not depend on frontend timing.

---

## 9. Driver Availability Race

Test simultaneous requests such as:

- driver accepts delivery;
- driver changes availability to OFFLINE;
- driver accepts another delivery.

Expected:

- backend preserves a valid state;
- a BUSY driver cannot become AVAILABLE in a way that violates active delivery ownership;
- one driver cannot receive two active deliveries.

---

## 10. Order State Transition Race

For each important order transition, send concurrent requests attempting:

- the same valid transition twice;
- conflicting transitions;
- transition after another actor already changed the state.

Expected:

- one valid state transition;
- no invalid intermediate state;
- repeated transition handled idempotently or rejected consistently;
- audit/history remains coherent.

---

## 11. Pharmacy Confirmation and Customer Confirmation Race

Test simultaneous actions where:

- pharmacy confirms;
- pharmacy changes/loses eligibility;
- customer confirms/rejects;
- order transfer starts.

Expected:

- order follows one valid state-machine path;
- customer cannot confirm a stale price;
- a pharmacy that is no longer responsible cannot modify the order as responsible pharmacy;
- no payment can be created from stale order data.

---

## 12. Pricing and Payment Race

Run concurrently:

- pricing calculation;
- order price lock;
- payment creation;
- pharmacy transfer.

Expected:

- payment uses exactly one authoritative pricing snapshot;
- no payment is created from a stale quote;
- transfer cannot silently change the amount after the payment boundary;
- conflicting operations fail or retry deterministically.

---

## 13. Payment Idempotency Race

Send multiple identical payment-creation requests concurrently using the same idempotency key.

Expected:

- one logical payment operation;
- duplicate requests return the same logical result or safe idempotent response;
- no duplicate provider charge request is created by the backend.

Then test different idempotency keys against the same order.

Expected:

- business rules still prevent duplicate active payments where prohibited.

---

## 14. Webhook Race and Ordering

Send:

- duplicate webhook events concurrently;
- webhook events out of order;
- success and failure events close together;
- webhook against an already reconciled payment.

Expected:

- provider event uniqueness prevents duplicate effects;
- state transitions remain valid;
- UNKNOWN is not incorrectly converted to FAILED without authoritative evidence;
- stale events cannot overwrite a newer valid state.

---

## 15. Delivery State Races

Test concurrent requests around:

- driver assignment;
- arrival at pharmacy;
- handover;
- pickup;
- ON_THE_WAY;
- ARRIVING_SOON;
- OTP verification;
- DELIVERED;
- cash resolution.

Expected:

- delivery follows the defined state machine;
- impossible transitions are rejected;
- order and delivery states remain consistent;
- one active delivery remains the invariant.

---

## 16. Delivery OTP Race

Test:

- two simultaneous OTP verification requests;
- correct OTP and incorrect OTP concurrently;
- expired OTP and correct OTP concurrently;
- old OTP and newest OTP concurrently.

Expected:

- OTP is one-time;
- only the latest valid active OTP is accepted;
- successful verification invalidates reuse;
- rate limits are enforced;
- delivery cannot be delivered twice through concurrent verification.

---

## 17. Cash Collection Race

Test concurrent:

- cash received;
- cash unpaid;
- partial payment;
- dispute;
- exception handling.

Expected:

- cash status is one authoritative state;
- driver BUSY status is preserved until the defined resolution point;
- order completion cannot occur before required cash resolution;
- duplicate cash confirmation is idempotent.

---

## 18. Consultation Assignment Race

Test multiple eligible pharmacists attempting to acquire/accept the same consultation.

Expected:

- one assigned pharmacist where the model requires a single assignment;
- no unauthorized pharmacist can read the consultation;
- customer cannot accidentally create multiple active consultations;
- consultation state remains valid.

Also test concurrent customer requests for a new consultation.

Expected:

- the one-active-consultation invariant is enforced.

---

## 19. Prescription Upload Race

Test:

- concurrent prescription version creation;
- deletion while a new version is being attached;
- access request during version replacement.

Expected:

- versions remain consistent;
- no orphaned authoritative references;
- signed URLs respect current authorization;
- deleted/private files are not accidentally exposed.

---

## 20. Membership and Authorization Race

Test:

- membership deactivation while a pharmacy action is being submitted;
- owner transfer/update while an owner action is submitted;
- pharmacist removal while consultation access is requested.

Expected:

- authorization is resolved from the committed authoritative state;
- deactivated membership cannot continue gaining new protected access;
- no operation creates two active owners where prohibited.

---

## 21. OTP Authentication Race

Test:

- multiple OTP requests for the same phone;
- verification of old and newest OTP concurrently;
- repeated correct OTP submissions.

Expected:

- only the valid/latest OTP according to policy succeeds;
- successful verification cannot be replayed;
- rate limiting remains correct;
- no duplicate identity creation occurs.

---

## 22. Database-Level Verification

After every critical concurrency test, verify database invariants directly.

Examples:

- count of active assignments per order <= 1;
- count of active deliveries per order <= 1;
- count of active deliveries per driver <= 1;
- one active owner per pharmacy;
- one active consultation per customer;
- no duplicate payment idempotency key;
- no duplicate webhook event;
- state relationships remain valid.

The tests must inspect the final committed database state, not only API responses.

---

## 23. Load and Stress Testing

After deterministic race tests pass, run controlled load tests for critical endpoints.

Priority targets:

- OTP request/verification;
- order submission;
- pharmacy confirmation;
- pharmacy transfer acceptance;
- driver acceptance;
- payment creation;
- webhook processing;
- delivery OTP verification.

Stress testing must verify both correctness and acceptable resource usage.

A system that is fast but violates an invariant under load is considered failed.

---

## 24. Failure Injection

Introduce controlled failures at transaction boundaries, such as:

- process termination;
- database connection interruption;
- timeout;
- provider timeout;
- network retry;
- request retry after unknown client response.

Expected:

- transactions roll back atomically where appropriate;
- idempotent retries do not duplicate effects;
- UNKNOWN payment states remain recoverable;
- no half-completed business transition becomes authoritative.

---

## 25. Test Data Isolation

Concurrency tests must use isolated test data.

Tests must not depend on:

- real customer data;
- real payment credentials;
- production pharmacies;
- production drivers;
- production consultation content.

Tests should create controlled fixtures/factories and clean them deterministically.

---

## 26. Acceptance Criteria

Concurrency implementation is acceptable only when:

- critical invariants are protected by transactions and/or database constraints;
- duplicate requests cannot create duplicate business effects;
- first-valid-driver-acceptance behavior is deterministic;
- payment idempotency is proven;
- webhook uniqueness is proven;
- UNKNOWN payment state remains recoverable;
- state-machine transitions remain valid under concurrent requests;
- authorization remains correct during membership changes;
- no critical race depends on frontend button disabling.

---

## 27. Implementation Sequence

1. List every critical invariant from the SRS and state matrix.
2. Map each invariant to a database constraint, transaction, lock, or conditional update.
3. Implement idempotency where required.
4. Build deterministic race tests.
5. Add failure-injection tests.
6. Run load/stress tests.
7. Verify final database invariants.
8. Block production release until critical concurrency tests pass.

---

## 28. Change Policy

Any change to:

- transaction boundaries;
- database uniqueness constraints;
- isolation levels;
- locking strategy;
- idempotency semantics;
- state transitions;
- payment concurrency;
- driver assignment;
- pharmacy assignment;
- consultation assignment

requires review against the SRS, ERD, state matrix, OpenAPI contract, and this test plan.

---

## 29. Final Principle

> Concurrency correctness is a backend and database responsibility: every critical business invariant must remain true even when valid requests arrive simultaneously, retry, time out, or complete in an unexpected order.
