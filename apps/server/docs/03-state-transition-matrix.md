# Shafaq — State Transition Matrix

## Purpose

This document defines the canonical state machines for Shafaq v1.2.

All state transitions are controlled by the backend.

The frontend must never directly assign arbitrary state values.

Every transition must satisfy:

* Current state
* Actor authorization
* Business conditions
* Required validations
* Concurrency rules
* Transaction boundaries

Invalid transitions must be rejected.

---

# 1. Pharmacy Approval Status

## States

* `PENDING_APPROVAL`
* `APPROVED`
* `REJECTED`
* `SUSPENDED`

## Allowed transitions

| From             | To        | Actor | Conditions                                   |
| ---------------- | --------- | ----- | -------------------------------------------- |
| PENDING_APPROVAL | APPROVED  | ADMIN | Pharmacy registration passes approval checks |
| PENDING_APPROVAL | REJECTED  | ADMIN | Pharmacy registration is rejected            |
| APPROVED         | SUSPENDED | ADMIN | Administrative suspension is required        |
| SUSPENDED        | APPROVED  | ADMIN | Suspension is explicitly resolved            |

No other approval transition is defined by the current SRS.

---

# 2. Pharmacy Operational Status

## States

* `OPEN`
* `CLOSED`

## Allowed transitions

| From   | To     | Actor         | Conditions                             |
| ------ | ------ | ------------- | -------------------------------------- |
| CLOSED | OPEN   | OWNER / ADMIN | Pharmacy approval status is `APPROVED` |
| OPEN   | CLOSED | OWNER / ADMIN | Pharmacy may stop accepting new orders |

A pharmacy must not become `OPEN` unless:

`approvalStatus = APPROVED`

A pharmacy receives new orders only when:

`approvalStatus = APPROVED`

AND

`operationalStatus = OPEN`

Changing operational status does not change approval status.

---

# 3. Driver Approval Status

## States

* `PENDING_APPROVAL`
* `APPROVED`
* `REJECTED`
* `SUSPENDED`

## Allowed transitions

| From             | To        | Actor | Conditions                            |
| ---------------- | --------- | ----- | ------------------------------------- |
| PENDING_APPROVAL | APPROVED  | ADMIN | Driver passes approval checks         |
| PENDING_APPROVAL | REJECTED  | ADMIN | Driver application is rejected        |
| APPROVED         | SUSPENDED | ADMIN | Administrative suspension is required |
| SUSPENDED        | APPROVED  | ADMIN | Suspension is explicitly resolved     |

No other approval transition is defined by the current SRS.

---

# 4. Driver Availability Status

## States

* `OFFLINE`
* `AVAILABLE`
* `BUSY`

## Allowed transitions

| From      | To        | Actor  | Conditions                                                              |
| --------- | --------- | ------ | ----------------------------------------------------------------------- |
| OFFLINE   | AVAILABLE | DRIVER | Driver is approved and eligible                                         |
| AVAILABLE | OFFLINE   | DRIVER | Driver has no active delivery                                           |
| AVAILABLE | BUSY      | SYSTEM | Driver accepts a delivery                                               |
| BUSY      | AVAILABLE | SYSTEM | Delivery and cash obligations are resolved and driver remains available |
| BUSY      | OFFLINE   | SYSTEM | Delivery and cash obligations are resolved and driver becomes offline   |

A driver with an unresolved active delivery or cash exception must not become `OFFLINE` or `AVAILABLE`.

---

# 5. Order State

## States

* `PENDING`
* `PHARMACY_REVIEWING`
* `PHARMACY_CONFIRMED`
* `CUSTOMER_CONFIRMATION_PENDING`
* `PAYMENT_PENDING`
* `PAID`
* `PHARMACY_PREPARING`
* `READY_FOR_PICKUP`
* `IN_DELIVERY`
* `DELIVERED`
* `COMPLETED`
* `CLOSED`

## Main flow

```text
PENDING
→ PHARMACY_REVIEWING
→ PHARMACY_CONFIRMED
→ CUSTOMER_CONFIRMATION_PENDING
→ PAYMENT_PENDING
→ PAID
→ PHARMACY_PREPARING
→ READY_FOR_PICKUP
→ IN_DELIVERY
→ DELIVERED
→ COMPLETED
```

## Allowed transitions

| From                          | To                            | Actor             | Conditions                                                  |
| ----------------------------- | ----------------------------- | ----------------- | ----------------------------------------------------------- |
| PENDING                       | PHARMACY_REVIEWING            | SYSTEM / PHARMACY | Valid order exists and responsible pharmacy can review      |
| PHARMACY_REVIEWING            | PHARMACY_CONFIRMED            | PHARMACY          | Pharmacy can fulfill the complete order                     |
| PHARMACY_REVIEWING            | CLOSED                        | PHARMACY / SYSTEM | Order cannot continue and no transfer is accepted           |
| PHARMACY_CONFIRMED            | CUSTOMER_CONFIRMATION_PENDING | SYSTEM            | Final medicine price is available                           |
| CUSTOMER_CONFIRMATION_PENDING | PAYMENT_PENDING               | CUSTOMER          | Customer accepts the final price                            |
| CUSTOMER_CONFIRMATION_PENDING | CLOSED                        | CUSTOMER          | Customer rejects the final price                            |
| PAYMENT_PENDING               | PAID                          | PAYMENT SYSTEM    | Payment is successfully confirmed                           |
| PAID                          | PHARMACY_PREPARING            | PHARMACY          | Valid payment confirmed                                     |
| PHARMACY_PREPARING            | READY_FOR_PICKUP              | PHARMACY          | Preparation completed and delivery conditions are satisfied |
| READY_FOR_PICKUP              | IN_DELIVERY                   | SYSTEM            | Active delivery exists and pickup process begins            |
| IN_DELIVERY                   | DELIVERED                     | DRIVER / SYSTEM   | Delivery OTP is successfully validated                      |
| DELIVERED                     | COMPLETED                     | SYSTEM            | Required cash obligations are resolved                      |

`DELIVERED` is not equivalent to `COMPLETED`.

Payment status `UNKNOWN` must not be treated as automatic payment failure.

### Complete-order availability rule

The pharmacy quote is evaluated against every requested `OrderItem`.

If any requested item is unavailable:

* `PHARMACY_REVIEWING` must not transition directly to `PHARMACY_CONFIRMED`.
* Partial fulfillment is not supported.
* The original complete order remains unchanged; unavailable items are not removed.
* The current pharmacy may reject or request transfer of the complete order.
* A receiving pharmacy is offered the complete original order and must explicitly
	accept it before its assignment becomes `ACTIVE`.
* The receiving pharmacy reviews the complete order again.
* If no eligible pharmacy accepts, the order transitions to `CLOSED` according to
	the existing `PHARMACY_REVIEWING -> CLOSED` rule.

There is no partial customer confirmation and no new order status for
unavailable medicines. `medicineSubtotal` is finalized only when the complete
order is fulfillable and a pharmacy can transition it to
`PHARMACY_CONFIRMED`.

### Pharmacy responsibility invariant

`Order.pharmacyId` records the original pharmacy selected by the customer and
does not change during transfer. It must not be used to determine the current
responsible pharmacy. The current responsible pharmacy is determined
exclusively by the single `ACTIVE` `PharmacyAssignment`.

For a fully fulfillable order, the backend calculates and persists:

`OrderItem.totalPrice = quantity × unitPrice`

`medicineSubtotal = SUM(OrderItem.totalPrice)`

`totalAmount = medicineSubtotal + deliveryFee`

Client-supplied subtotal and delivery fee values are non-authoritative.

---

# 6. Pharmacy Assignment

## States

* `OFFERED`
* `ACTIVE`
* `REJECTED`
* `EXPIRED`
* `CANCELLED`
* `COMPLETED`
* `TRANSFERRED`

## Allowed transitions

| From    | To          | Actor                     | Conditions                                            |
| ------- | ----------- | ------------------------- | ----------------------------------------------------- |
| OFFERED | ACTIVE      | PHARMACY                  | Receiving pharmacy explicitly accepts                 |
| OFFERED | REJECTED    | PHARMACY                  | Pharmacy explicitly rejects                           |
| OFFERED | EXPIRED     | SYSTEM                    | Offer expires                                         |
| OFFERED | CANCELLED   | SYSTEM / AUTHORIZED ACTOR | Offer is cancelled before activation                  |
| ACTIVE  | COMPLETED   | SYSTEM                    | Order is successfully completed by this pharmacy      |
| ACTIVE  | TRANSFERRED | SYSTEM                    | Order is explicitly transferred to another pharmacy   |
| ACTIVE  | CANCELLED   | AUTHORIZED ACTOR          | Assignment is cancelled according to exception policy |

`ACCEPTED` must not be used as a separate assignment state.

Only one pharmacy assignment may be `ACTIVE` for an order.

---

# 7. Payment Status

## States

* `PENDING`
* `PROCESSING`
* `PAID`
* `FAILED`
* `UNKNOWN`
* `REFUNDED`

## Rules

* `UNKNOWN` is not equivalent to `FAILED`.
* Payment operations must be idempotent.
* Webhook events must be uniquely identifiable.
* An `UNKNOWN` payment requires reconciliation before the order can proceed where payment confirmation is required.
* The application must not invent or assume a provider-specific payment transition without the verified payment contract.
* `REFUNDED` must only be used when a refund is explicitly authorized by the applicable exception or payment policy.
* The existence of `REFUNDED` does not imply that normal customer cancellation or refund is allowed after an order is locked and paid.

---

# 8. Delivery State

## States

* `NOT_STARTED`
* `SEARCHING_FOR_DRIVER`
* `DRIVER_ASSIGNED`
* `GOING_TO_PHARMACY`
* `ARRIVED_AT_PHARMACY`
* `HANDOVER_PENDING`
* `PICKED_UP`
* `ON_THE_WAY`
* `ARRIVING_SOON`
* `OTP_PENDING`
* `DELIVERED`
* `CASH_PENDING`
* `COMPLETED`

## Main flow

```text
NOT_STARTED
→ SEARCHING_FOR_DRIVER
→ DRIVER_ASSIGNED
→ GOING_TO_PHARMACY
→ ARRIVED_AT_PHARMACY
→ HANDOVER_PENDING
→ PICKED_UP
→ ON_THE_WAY
→ ARRIVING_SOON
→ OTP_PENDING
→ DELIVERED
→ CASH_PENDING
→ COMPLETED
```

## Rules

* The first valid driver acceptance wins.
* Only one active delivery may exist per order.
* Only one active delivery may exist per driver.
* The driver must be approved before accepting delivery work.
* The driver becomes `BUSY` when assigned to an active delivery.
* The driver must not normally cancel a delivery.
* Delivery OTP is one-time, hashed, rate-limited, and expiring.
* Only the latest active OTP is valid.
* `DELIVERED` does not mean `COMPLETED`.
* A delivery must not be completed while required cash obligations remain unresolved.

---

# 9. Cash Status

## States

* `NOT_DUE`
* `DUE`
* `RECEIVED`
* `UNPAID`
* `PARTIALLY_PAID`
* `DISPUTED`

## Main flow

```text
NOT_DUE
→ DUE
→ RECEIVED
```

## Exception flows

```text
DUE
→ UNPAID

DUE
→ PARTIALLY_PAID

UNPAID
→ DISPUTED

PARTIALLY_PAID
→ DISPUTED
```

## Rules

* Cash is collected by the driver when applicable.
* The driver must not be shown the delivery fee before accepting the delivery.
* `UNPAID` and `PARTIALLY_PAID` are exceptions and must not be silently treated as `RECEIVED`.
* The driver remains `BUSY` until cash resolution or explicit exception resolution.
* An order must not become `COMPLETED` while required cash resolution remains unresolved.

---

# 10. Consultation State

## States

* `REQUESTED`
* `ASSIGNED`
* `IN_PROGRESS`
* `WAITING_FOR_CUSTOMER`
* `COMPLETED`
* `CANCELLED`
* `EXPIRED`

## Allowed transitions

| From                 | To                   | Actor                        | Conditions                            |
| -------------------- | -------------------- | ---------------------------- | ------------------------------------- |
| REQUESTED            | ASSIGNED             | SYSTEM / AUTHORIZED PHARMACY | Pharmacist is assigned                |
| ASSIGNED             | IN_PROGRESS          | ASSIGNED PHARMACIST          | Pharmacist starts consultation        |
| IN_PROGRESS          | WAITING_FOR_CUSTOMER | ASSIGNED PHARMACIST          | Pharmacist requires customer response |
| WAITING_FOR_CUSTOMER | IN_PROGRESS          | CUSTOMER                     | Customer responds                     |
| IN_PROGRESS          | COMPLETED            | ASSIGNED PHARMACIST          | Consultation is completed             |
| REQUESTED            | CANCELLED            | CUSTOMER / SYSTEM            | Cancellation is permitted             |
| ASSIGNED             | CANCELLED            | CUSTOMER / SYSTEM            | Cancellation is permitted             |
| REQUESTED            | EXPIRED              | SYSTEM                       | Request exceeds allowed time          |
| ASSIGNED             | EXPIRED              | SYSTEM                       | Assignment exceeds allowed time       |

Only one active consultation is allowed per customer.

Consultation content is private between the customer and assigned pharmacist.

Admin users must not receive consultation-content access through ordinary administrative permissions.

Pharmacy owners may manage pharmacist assignments but must not read consultation content unless they are the assigned pharmacist.

---

# 11. Cross-State Invariants

## Pharmacy eligibility

A pharmacy may receive new orders only when:

`approvalStatus = APPROVED`

AND

`operationalStatus = OPEN`

## Driver eligibility

A driver must have:

`approvalStatus = APPROVED`

before accepting delivery work.

The driver must also be eligible according to the driver availability rules.

## Paid order preparation

An order may enter:

`PHARMACY_PREPARING`

only after valid payment confirmation.

A payment status of `UNKNOWN` is not sufficient.

## Ready for pickup

An order may enter:

`READY_FOR_PICKUP`

only when:

* Payment is valid
* Pharmacy assignment is active
* Preparation is confirmed
* Payment is not `UNKNOWN`
* No conflicting active delivery exists

## Delivery completion

An order must not become:

`COMPLETED`

while required cash resolution remains unresolved.

## Consultation privacy

State transitions must never grant consultation-content access to an unauthorized user.

---

# 12. Concurrency Requirements

State transitions that can be triggered concurrently must be protected by backend transaction and concurrency controls.

Critical examples include:

* Two pharmacies attempting to activate the same transferred order
* Two drivers attempting to accept the same delivery
* Duplicate payment webhooks
* Repeated delivery OTP submissions
* Two simultaneous order state transitions
* Duplicate consultation assignment

The system must enforce the relevant uniqueness and state conditions atomically.

The backend must re-check the current state inside the protected transaction before committing a transition.

The first valid transaction that satisfies the required conditions wins where the business rule requires first-wins behavior.

Failed concurrent attempts must receive a standard business error and must not partially mutate related records.

---

# 13. Invalid Transition Policy

Any transition not explicitly permitted by the applicable state machine must be rejected.

The API must return a standard business error with a `requestId`.

The frontend must not attempt to bypass state restrictions.

A rejected transition must not partially update the order, assignment, delivery, payment, cash, or consultation state.

The backend must enforce state-machine rules independently of frontend validation.

---

# 14. State-Machine Change Policy

Any business-rule change affecting a state machine requires updates to:

1. SRS
2. Decision Log
3. State Transition Matrix
4. ERD where applicable
5. OpenAPI where applicable
6. Automated tests

State changes must never be introduced silently in implementation code.

The SRS remains the business-rule authority.

The State Transition Matrix is the implementation-level state-machine authority derived from the SRS.

If implementation code conflicts with this document, the conflict must be resolved before proceeding with the affected feature.


# 13. Order State History

Every order state transition must create an `OrderStateHistory` record in the same database transaction as the state mutation.

Each history record stores:

- orderId
- previousState
- newState
- actorUserId when an authenticated actor caused the transition
- reason when available
- requestId when available
- metadata when safe and useful
- timestamp

A transition is not considered committed unless both the order state mutation and its history record commit successfully.

Direct order status mutations outside the state-transition mechanism are prohibited.
