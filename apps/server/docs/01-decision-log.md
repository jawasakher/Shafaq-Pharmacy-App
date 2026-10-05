# Shafaq — Decision Log

## Purpose

This document records the implementation decisions that are considered authoritative for Shafaq v1.2.

The backend, database schema, API contracts, state machines, permissions, and frontend behavior must follow these decisions.

If implementation code conflicts with an approved decision, the implementation must be changed unless the decision itself is formally revised.

---

## D-001 — Backend is the business-rule authority

The backend is the single source of truth for:

- Authentication and authorization
- User roles
- Pharmacy approval and operational status
- Pharmacy membership
- Order state transitions
- Pharmacy assignment
- Payment state
- Delivery state
- Driver availability
- Consultation assignment and privacy
- Prescription access
- Delivery pricing
- Concurrency and idempotency rules

The frontend must not be trusted to enforce business rules.

---

## D-002 — Pharmacy ownership is membership-based

Pharmacy ownership is represented through `PharmacyMember`.

The system must not use:

- `pharmacies.owner_user_id`
- `pharmacistId`
- A direct pharmacist field on `Pharmacy`

A pharmacy member has one of:

- `OWNER`
- `PHARMACIST`

There can be one active owner per pharmacy.

---

## D-003 — Pharmacy registration requires approval

A newly registered pharmacy starts with:

`PENDING_APPROVAL`

Allowed approval states:

- `PENDING_APPROVAL`
- `APPROVED`
- `REJECTED`
- `SUSPENDED`

Only an approved pharmacy can become operational.

---

## D-004 — Pharmacy operational status is separate from approval status

Approval status answers:

> Is this pharmacy authorized to operate on the platform?

Operational status answers:

> Is this approved pharmacy currently accepting new orders?

Operational states:

- `OPEN`
- `CLOSED`

A pharmacy receives new orders only when:

`approvalStatus = APPROVED`

AND

`operationalStatus = OPEN`

---

## D-005 — Pharmacy owner who is also a pharmacist

If the pharmacy registrant is also a pharmacist, the user is represented as:

- `User.role = OWNER`
- `PharmacyMember.role = OWNER`

No separate special registration flow is required.

Working pharmacists are represented as:

`PharmacyMember.role = PHARMACIST`

---

## D-006 — Internal roles

The platform supports these user roles:

- `CUSTOMER`
- `OWNER`
- `PHARMACIST`
- `DRIVER`
- `ADMIN`

Role alone is not sufficient for authorization where resource membership or assignment is required.

---

## D-007 — Consultation privacy

A consultation is private between:

- The customer
- The assigned pharmacist

The pharmacy owner may manage pharmacist assignments but must not read consultation content unless they are the assigned pharmacist.

Administrators must not read consultation chat content in the normal workflow.

---

## D-008 — Driver approval and availability are separate

Driver approval states:

- `PENDING_APPROVAL`
- `APPROVED`
- `REJECTED`
- `SUSPENDED`

Driver availability states:

- `OFFLINE`
- `AVAILABLE`
- `BUSY`

Only an approved driver can become available for delivery work.

---

## D-009 — Authentication model

Customers authenticate using:

- Phone number
- OTP

Internal users use secure session-based authentication.

Administrative accounts require MFA in production.

---

## D-010 — Order fulfillment is single-pharmacy

An order is fulfilled entirely by one responsible pharmacy at a time.

`Order.pharmacyId` is retained as the immutable original pharmacy selected by
the customer when the order is created. It is a historical/reference field for
the original selection only; it is not the authoritative current responsible
pharmacy.

At initial order creation, `Order.pharmacyId` and the initial
`PharmacyAssignment.pharmacyId` contain the same pharmacy. During transfer,
`Order.pharmacyId` never changes. The receiving pharmacy is represented by a
new `PharmacyAssignment`, and becomes the current responsible pharmacy only
when that assignment becomes `ACTIVE`.

Authorization, Order Review, pricing-origin resolution, and any other operation
that needs the current responsible pharmacy must resolve it exclusively from
the single `ACTIVE` `PharmacyAssignment`. No code may use `Order.pharmacyId` as
proof of current responsibility.

Partial fulfillment across multiple pharmacies is not supported.

If a pharmacy cannot fulfill the complete request, the order may be transferred to another pharmacy according to the transfer workflow.

If any requested medicine is unavailable, the current pharmacy must not confirm
the order as a partial fulfillment. The complete original order remains intact:
unavailable items are not removed, reduced, or split into a separate order.

The current pharmacy may reject or request transfer of the complete order. Any
eligible receiving pharmacy is offered the complete original order, not only
the unavailable items, and must explicitly accept before becoming responsible.
The receiving pharmacy reviews the complete order again. If no eligible
pharmacy accepts, the order follows the existing `CLOSED` outcome for an order
that cannot continue and has no accepted transfer.

There is no partial customer confirmation. The customer may not accept only the
available items. `medicineSubtotal` is finalized only after a pharmacy confirms
that it can fulfill the complete order. No new `OrderStatus` is introduced for
unavailable medicines.

---

## D-011 — Pharmacy transfer requires acceptance

A pharmacy transfer is not automatic.

The receiving pharmacy must explicitly accept or reject the transferred order.

Only one pharmacy assignment can be active for an order.

---

## D-012 — Pharmacy assignment states

The canonical pharmacy assignment states are:

- `OFFERED`
- `ACTIVE`
- `REJECTED`
- `EXPIRED`
- `CANCELLED`
- `COMPLETED`
- `TRANSFERRED`

`ACCEPTED` and `ACTIVE` must not be used as parallel states.

Acceptance results in the assignment becoming `ACTIVE`.

---

## D-013 — Payment abstraction

Payment must be implemented through a payment adapter abstraction.

V1 payment provider:

`Sham Cash`

The implementation must not invent undocumented provider API, authentication, or webhook contracts.

The official provider documentation must be verified before provider-specific integration.

---

## D-014 — Unknown payment state is not failure

Payment status may be:

`UNKNOWN`

An unknown payment result must not automatically be treated as a failed payment.

Unknown payments require reconciliation.

Payment operations must support idempotency.

Webhook events must be uniquely identifiable.

---

## D-015 — Delivery pricing is a backend service

Delivery pricing is calculated through:

`DeliveryPricingService`

Delivery pricing must not be hardcoded in the frontend.

The calculated price must be stored as a pricing snapshot for the order.

Medicine pricing is also backend-authoritative. For every fulfillable order:

`OrderItem.totalPrice = quantity × unitPrice`

`Order.medicineSubtotal = SUM(OrderItem.totalPrice)`

The backend calculates and persists both values. A client-supplied
`medicineSubtotal` may remain in the Quote request for API compatibility, but
it is never authoritative. A client-supplied `deliveryFee` is never
authoritative; `DeliveryPricingService` calculates the authoritative value.

The final payable amount is:

`Order.totalAmount = medicineSubtotal + deliveryFee`

The backend calculates and persists `totalAmount` and `currency`. The V1
currency value remains a pending business decision and must not be invented.

---

## D-016 — Delivery fee collection

In V1, the delivery fee is paid in cash to the driver upon delivery.

The driver must not see the delivery fee before accepting the delivery.

---

## D-017 — Delivery completion is separate from delivery

`DELIVERED` does not mean `COMPLETED`.

The customer delivery OTP confirms the delivery event.

Cash collection and cash resolution happen after delivery where applicable.

---

## D-018 — Driver assignment

The first valid driver acceptance wins.

The system must enforce:

- One active delivery per order
- One active delivery per driver

The driver remains `BUSY` until the delivery and cash resolution are completed, or an explicit exception is resolved.

---

## D-019 — Driver cancellation

The driver has no normal cancellation action.

Delivery exceptions must use the defined exception workflow.

---

## D-020 — Delivery OTP

Delivery OTP must be:

- One-time use
- Hashed at rest
- Rate-limited
- Expiring
- Valid only for the latest active OTP

---

## D-021 — Consultation lifecycle

Consultation states:

- `REQUESTED`
- `ASSIGNED`
- `IN_PROGRESS`
- `WAITING_FOR_CUSTOMER`
- `COMPLETED`
- `CANCELLED`
- `EXPIRED`

Only one active consultation is allowed per customer.

---

## D-022 — Prescription privacy

Prescription files are private.

Access must use:

- Private storage
- Signed temporary URLs
- Versioning

Public permanent prescription URLs are not allowed.

---

## D-023 — API versioning

The API base path is:

`/api/v1`

API responses must follow a standard success/error structure and include a `requestId` where applicable.

Large collections use cursor-based pagination.

---

## D-024 — State-machine authority

State transitions are controlled by backend domain rules.

The frontend must not directly set arbitrary state values.

Invalid transitions must be rejected by the backend.

---

## D-025 — Implementation order

The implementation follows this order:

1. Foundation
2. Identity
3. Pharmacy
4. Orders
5. Prescription
6. Pharmacy Transfer
7. Payment
8. Delivery
9. Tracking
10. OTP / Cash
11. Exceptions
12. Consultation
13. Notifications
14. Admin
15. Testing
16. Deployment

---

## D-026 — Source of truth hierarchy

Implementation decisions follow this hierarchy:

1. Business Rules
2. State Machines
3. Database Constraints
4. Transactions / Concurrency Controls
5. Domain Services
6. API Contracts
7. Frontend

A lower layer must not contradict a higher layer.

---

## D-027 — Schema change policy

If code conflicts with the SRS:

- Change the code to match the SRS.

If a business rule changes:

- Update the SRS.
- Update this Decision Log.
- Update the State Transition Matrix.
- Update the ERD.
- Update OpenAPI.
- Update affected tests.

No silent business-rule changes are allowed.
