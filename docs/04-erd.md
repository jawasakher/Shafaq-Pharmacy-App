# Shafaq — Entity Relationship Diagram

## Purpose

This document defines the canonical logical data model for Shafaq v1.2.

It describes:

* Core entities
* Relationships
* Ownership
* Cardinality
* State fields
* Important uniqueness constraints
* Referential integrity
* Privacy boundaries
* Transaction-critical relationships

The ERD is derived from:

1. Shafaq SRS v1.2
2. Decision Log
3. Permission Matrix
4. State Transition Matrix

The backend database is the persistent source of truth.

---

# 1. Modeling Principles

The data model must enforce business rules as close to the database layer as practical.

The implementation must follow:

```text
Business Rules
→ State Machines
→ Database Constraints
→ Transactions / Concurrency
→ Domain Services
→ API
→ Frontend
```

The frontend must never be treated as the source of truth for:

* Ownership
* Roles
* Pharmacy approval
* Pharmacy operational status
* Driver approval
* Driver availability
* Order state
* Pharmacy assignment
* Payment state
* Delivery state
* Cash state
* Consultation assignment
* Consultation privacy

---

# 2. Core Identity Entities

## 2.1 User

Represents every authenticated person in the platform.

### Key fields

* `id`
* `phone`
* `name`
* `role`
* `createdAt`
* `updatedAt`

### Roles

```text
CUSTOMER
OWNER
PHARMACIST
DRIVER
ADMIN
```

### Relationships

```text
User 1 ──── 0..* Address
User 1 ──── 0..* PharmacyMember
User 1 ──── 0..1 Driver
```

### Constraints

* `phone` must be unique.
* A user may have multiple addresses.
* A user may have multiple pharmacy memberships.
* A user may have at most one driver profile.
* Authorization must not rely only on the `User.role` field when pharmacy-specific membership is required.

---

# 3. Address

Represents a customer delivery address.

### Key fields

* `id`
* `userId`
* `type`
* `label`
* `address`
* `latitude`
* `longitude`
* `isDefault`
* `createdAt`
* `updatedAt`

### Address types

```text
HOME
WORK
OTHER
```

### Relationship

```text
User 1 ──── 0..* Address
```

### Constraints

* Every address belongs to exactly one user.
* Deleting a user deletes their addresses.
* Coordinates are stored as decimal latitude/longitude.
* The backend must validate coordinate ranges.
* An order must retain the delivery address information required for historical correctness even if the customer later edits or deletes their saved address.

---

# 4. Pharmacy

Represents a registered pharmacy.

### Key fields

* `id`
* `name`
* `phone`
* `address`
* `latitude`
* `longitude`
* `approvalStatus`
* `operationalStatus`
* `createdAt`
* `updatedAt`

### Approval status

```text
PENDING_APPROVAL
APPROVED
REJECTED
SUSPENDED
```

### Operational status

```text
OPEN
CLOSED
```

### Relationships

```text
Pharmacy 1 ──── 0..* PharmacyMember
Pharmacy 1 ──── 0..* PharmacyAssignment
```

Future order and assignment entities will reference the pharmacy through explicit foreign keys.

### Business constraints

A pharmacy may receive new orders only when:

```text
approvalStatus = APPROVED
AND
operationalStatus = OPEN
```

The database must not use a single generic `status` field for both approval and operational status.

---

# 5. PharmacyMember

Represents a user's membership within a pharmacy.

This entity is the authoritative source for pharmacy-specific ownership and pharmacist membership.

### Key fields

* `id`
* `pharmacyId`
* `userId`
* `role`
* `status`
* `createdAt`
* `updatedAt`

### Roles

```text
OWNER
PHARMACIST
```

### Membership status

```text
ACTIVE
INACTIVE
```

### Relationships

```text
Pharmacy 1 ──── 0..* PharmacyMember
User     1 ──── 0..* PharmacyMember
```

### Constraints

* A membership belongs to exactly one pharmacy and one user.
* `(pharmacyId, userId)` must be unique for the current model.
* Only active memberships grant pharmacy access.
* Pharmacy ownership must not be represented using `pharmacies.owner_user_id`.
* Pharmacy ownership must not be represented using `pharmacistId`.
* There must be one active `OWNER` per pharmacy.
* Pharmacists are represented as `PHARMACIST` memberships.
* If the owner is also a pharmacist, the owner remains represented by the `OWNER` membership unless the SRS explicitly introduces another membership model.

---

# 6. Driver

Represents a delivery driver profile linked to a user.

### Key fields

* `id`
* `userId`
* `approvalStatus`
* `availabilityStatus`
* `createdAt`
* `updatedAt`

### Approval status

```text
PENDING_APPROVAL
APPROVED
REJECTED
SUSPENDED
```

### Availability status

```text
OFFLINE
AVAILABLE
BUSY
```

### Relationship

```text
User 1 ──── 0..1 Driver
```

### Constraints

* `userId` must be unique.
* A driver must be approved before accepting delivery work.
* A driver with unresolved delivery or cash obligations must remain `BUSY`.
* Driver availability transitions are controlled by backend rules.

---

# 7. Order

Represents the customer's medicine order.

This entity is the central aggregate for the medicine-delivery workflow.

### Key fields

* `id`
* `customerId`
* Delivery address snapshot fields
* `status`
* `subtotal`
* `deliveryFee`
* `totalAmount`
* `currency`
* `createdAt`
* `updatedAt`

### Order states

```text
PENDING
PHARMACY_REVIEWING
PHARMACY_CONFIRMED
CUSTOMER_CONFIRMATION_PENDING
PAYMENT_PENDING
PAID
PHARMACY_PREPARING
READY_FOR_PICKUP
IN_DELIVERY
DELIVERED
COMPLETED
CLOSED
```

### Relationships

```text
User     1 ──── 0..* Order
Order    1 ──── 1..* OrderItem
Order    1 ──── 0..* PharmacyAssignment
Order    1 ──── 0..1 Payment
Order    1 ──── 0..1 Delivery
Order    1 ──── 0..* Prescription
```

### Critical business rule

An order is fulfilled entirely by one responsible pharmacy at a time.

The current responsible pharmacy is determined by the single `ACTIVE` `PharmacyAssignment`.

There must never be multiple active fulfillment pharmacies for the same order.

Pharmacy transfer is modeled through `PharmacyAssignment`, not by creating partial order fulfillment.

The Order entity must not contain a second independent pharmacy-ownership field that can conflict with `PharmacyAssignment`.

---

# 8. OrderItem

Represents an individual medicine requested by the customer.

### Key fields

* `id`
* `orderId`
* `medicineName`
* `quantity`
* `unitPrice`
* `totalPrice`
* `createdAt`
* `updatedAt`

### Relationship

```text
Order 1 ──── 1..* OrderItem
```

### Constraints

* Every order must contain at least one item.
* Quantity must be greater than zero.
* Final prices must be calculated and persisted by the backend.
* Client-provided totals must never be trusted as authoritative financial values.

---

# 9. PharmacyAssignment

Represents the responsibility of a pharmacy for an order.

This entity is also the mechanism used for pharmacy transfer.

### Key fields

* `id`
* `orderId`
* `pharmacyId`
* `status`
* `offeredAt`
* `acceptedAt`
* `rejectedAt`
* `completedAt`
* `createdAt`
* `updatedAt`

### Assignment states

```text
OFFERED
ACTIVE
REJECTED
EXPIRED
CANCELLED
COMPLETED
TRANSFERRED
```

### Relationships

```text
Order    1 ──── 0..*
Pharmacy 1 ──── 0..*
```

### Critical constraints

* Only one assignment may be `ACTIVE` for an order.
* A new pharmacy must explicitly accept a transfer before becoming active.
* Transfer must not create partial fulfillment.
* Concurrent activation attempts must be protected transactionally.
* `ACCEPTED` must not exist as a separate assignment state.

---

# 10. Prescription

Represents a prescription uploaded by the customer when required.

### Key fields

* `id`
* `orderId`
* `customerId`
* `storageKey`
* `version`
* `mimeType`
* `createdAt`
* `updatedAt`

### Relationships

```text
Order 1 ──── 0..* Prescription
User  1 ──── 0..* Prescription
```

### Privacy requirements

* Prescription files must be stored privately.
* Access must use authorized, temporary signed URLs.
* Storage must not expose permanent public URLs.
* Prescription versions must remain distinguishable.
* Access must be authorized by backend policy.

---

# 11. Payment

Represents the payment lifecycle for an order.

### Key fields

* `id`
* `orderId`
* `provider`
* `status`
* `amount`
* `currency`
* `providerReference`
* `idempotencyKey`
* `createdAt`
* `updatedAt`

### Payment states

```text
PENDING
PROCESSING
PAID
FAILED
UNKNOWN
REFUNDED
```

### Relationship

```text
Order 1 ──── 0..1 Payment
```

### Constraints

* Payment operations must be idempotent.
* Provider webhook events must be uniquely identifiable.
* `UNKNOWN` must not be treated as `FAILED`.
* Payment provider-specific fields must not leak into the core business model unnecessarily.
* The payment provider contract must be verified before implementation.
* The V1 provider is Sham Cash, but no unverified API or webhook contract may be invented.

---

# 12. PaymentEvent

Represents an incoming payment-provider event.

### Key fields

* `id`
* `paymentId`
* `provider`
* `providerEventId`
* `eventType`
* `payload`
* `processedAt`
* `createdAt`

### Relationship

```text
Payment 1 ──── 0..* PaymentEvent
```

### Constraints

* `(provider, providerEventId)` must be unique.
* Duplicate webhook events must be safely ignored or handled idempotently.
* Raw provider payload access must be restricted.
* Processing must be transactional where required.

---

# 13. Delivery

Represents the delivery operation for an order.

### Key fields

* `id`
* `orderId`
* `driverId`
* `status`
* `cashStatus`
* `deliveryFee`
* `assignedAt`
* `pickedUpAt`
* `deliveredAt`
* `completedAt`
* `createdAt`
* `updatedAt`

### Delivery states

```text
NOT_STARTED
SEARCHING_FOR_DRIVER
DRIVER_ASSIGNED
GOING_TO_PHARMACY
ARRIVED_AT_PHARMACY
HANDOVER_PENDING
PICKED_UP
ON_THE_WAY
ARRIVING_SOON
OTP_PENDING
DELIVERED
CASH_PENDING
COMPLETED
```

### Cash states

```text
NOT_DUE
DUE
RECEIVED
UNPAID
PARTIALLY_PAID
DISPUTED
```

### Relationships

```text
Order  1 ──── 0..1 Delivery
Driver 1 ──── 0..* Delivery
```

### Constraints

* Only one active delivery may exist for an order.
* Only one active delivery may exist for a driver.
* Driver must be approved before assignment.
* Driver becomes `BUSY` when assigned to an active delivery.
* Driver remains `BUSY` until delivery and cash obligations are resolved or an explicit exception is resolved.
* Delivery fee must be calculated by `DeliveryPricingService`.
* The calculated delivery price must be persisted as a pricing snapshot.
* Driver must not receive delivery-fee information before accepting the delivery.

---

# 14. DeliveryPricingSnapshot

Represents the pricing information used for a specific delivery.

### Key fields

* `id`
* `deliveryId`
* `distance`
* `baseFee`
* `distanceFee`
* `totalFee`
* `pricingVersion`
* `createdAt`

### Relationship

```text
Delivery 1 ──── 0..1 DeliveryPricingSnapshot
```

### Constraints

The snapshot must preserve the pricing decision used for the delivery even if the global pricing configuration changes later.

Pricing calculation must be performed by the backend.

---

# 15. DeliveryOTP

Represents the delivery verification OTP.

### Key fields

* `id`
* `deliveryId`
* `codeHash`
* `expiresAt`
* `usedAt`
* `createdAt`

### Relationship

```text
Delivery 1 ──── 0..* DeliveryOTP
```

### Security constraints

* OTP values must never be stored in plaintext.
* Only the latest active OTP may be valid.
* OTP must expire.
* OTP verification must be rate-limited.
* OTP can only be consumed once.
* Successful verification invalidates the OTP.

---

# 16. CashTransaction

Represents a cash collection or resolution event.

### Key fields

* `id`
* `deliveryId`
* `amount`
* `status`
* `recordedBy`
* `createdAt`

### Relationship

```text
Delivery 1 ──── 0..* CashTransaction
```

### Constraints

* Cash state must remain consistent with recorded cash events.
* Unpaid or partially paid cash must not be silently marked as received.
* Disputed cash must remain identifiable for exception handling.
* Driver availability must remain consistent with unresolved cash obligations.

---

# 17. Consultation

Represents a private pharmacist consultation.

### Key fields

* `id`
* `customerId`
* `pharmacistId`
* `status`
* `startedAt`
* `completedAt`
* `createdAt`
* `updatedAt`

### Consultation states

```text
REQUESTED
ASSIGNED
IN_PROGRESS
WAITING_FOR_CUSTOMER
COMPLETED
CANCELLED
EXPIRED
```

### Relationships

```text
User 1 ──── 0..* Consultation   (customer)
User 1 ──── 0..* Consultation   (assigned pharmacist)
Consultation 1 ──── 0..* ConsultationMessage
```

### Constraints

* Only one active consultation is allowed per customer.
* `pharmacistId` must reference an authorized pharmacist.
* The assigned pharmacist must have the required pharmacy membership.
* Consultation assignment must not expose content to unauthorized pharmacy staff.
* Admin users must not read consultation content through ordinary administrative access.

---

# 18. ConsultationMessage

Represents a private message inside a consultation.

### Key fields

* `id`
* `consultationId`
* `senderUserId`
* `message`
* `createdAt`

### Relationship

```text
Consultation 1 ──── 0..*
User         1 ──── 0..*
```

### Privacy boundary

Only:

* The customer
* The assigned pharmacist

may access consultation messages through normal application workflows.

Pharmacy owners, other pharmacists, drivers, and admins must not receive consultation-content access unless an explicit future policy changes this rule.

---

# 19. Notification

Represents a user-facing system notification.

### Key fields

* `id`
* `userId`
* `type`
* `title`
* `body`
* `readAt`
* `createdAt`

### Relationship

```text
User 1 ──── 0..* Notification
```

Notifications must not expose private consultation content or sensitive information beyond what is required for the notification purpose.

---

# 20. AuditLog

Represents security and administrative audit events.

### Key fields

* `id`
* `actorUserId`
* `action`
* `entityType`
* `entityId`
* `metadata`
* `createdAt`

### Relationship

```text
User 1 ──── 0..* AuditLog
```

### Requirements

Audit logs should record security-sensitive and administrative actions such as:

* Pharmacy approval
* Pharmacy suspension
* Driver approval
* Driver suspension
* Role or membership changes
* Payment state changes
* Delivery exceptions
* Cash disputes
* Administrative actions

Audit logs must not be used as a mechanism to expose consultation chat content to admins.

---

# 21. Entity Relationship Summary

```text
User
├── Address
├── PharmacyMember
├── Driver
├── Order
├── Consultation
├── Notification
└── AuditLog

Pharmacy
├── PharmacyMember
└── PharmacyAssignment

Order
├── OrderItem
├── PharmacyAssignment
├── Prescription
├── Payment
└── Delivery

Payment
└── PaymentEvent

Delivery
├── DeliveryPricingSnapshot
├── DeliveryOTP
└── CashTransaction

Consultation
└── ConsultationMessage
```

---

# 22. Critical Cardinality Rules

| Relationship                       | Cardinality |
| ---------------------------------- | ----------- |
| User → Address                     | 1 : 0..*    |
| User → PharmacyMember              | 1 : 0..*    |
| User → Driver                      | 1 : 0..1    |
| Pharmacy → PharmacyMember          | 1 : 0..*    |
| Pharmacy → PharmacyAssignment      | 1 : 0..*    |
| Order → OrderItem                  | 1 : 1..*    |
| Order → PharmacyAssignment         | 1 : 0..*    |
| Order → Payment                    | 1 : 0..1    |
| Order → Delivery                   | 1 : 0..1    |
| Order → Prescription               | 1 : 0..*    |
| Payment → PaymentEvent             | 1 : 0..*    |
| Delivery → DeliveryOTP             | 1 : 0..*    |
| Delivery → CashTransaction         | 1 : 0..*    |
| Consultation → ConsultationMessage | 1 : 0..*    |
| User → Notification                | 1 : 0..*    |
| User → AuditLog                    | 1 : 0..*    |

---

# 23. Database Integrity Requirements

The database implementation must enforce, where technically practical:

* Primary keys
* Foreign keys
* Required fields
* Unique constraints
* Appropriate indexes
* Valid enum values
* One-to-one relationships
* Active-record uniqueness
* Referential integrity
* Transaction boundaries

Business rules that cannot be fully represented by static database constraints must be enforced by transactional domain services.

---

# 24. Concurrency-Critical Constraints

The following operations require transactional protection:

### Pharmacy assignment

Only one pharmacy assignment may become `ACTIVE` for an order.

### Driver assignment

Only one driver may become active for a delivery.

### Payment webhook

A provider event must be processed at most once according to its unique provider event identifier.

### OTP

Only the latest active OTP may be consumed.

### Consultation assignment

Concurrent assignment attempts must not create multiple active assignments for the same consultation.

### Order state

Concurrent state transitions must re-check the current state before committing.

---

# 25. Historical Data and Snapshots

Operational entities must preserve the historical information required to correctly interpret completed transactions.

Examples include:

* Final medicine prices
* Final delivery fee
* Delivery pricing version
* Delivery address used for the order
* Payment provider reference
* Payment event history
* Prescription versions

Updating a customer's current profile or saved address must not rewrite historical order information.

---

# 26. Privacy Boundaries

The database model must support strict separation between operational access and private consultation data.

### Consultation

Private to:

```text
CUSTOMER
+
ASSIGNED PHARMACIST
```

### Prescription

Private and accessed through authorized backend-controlled temporary URLs.

### Payment data

Provider-sensitive information must be restricted to authorized backend services and roles.

### Audit data

Administrative audit information may be visible to authorized admins, but consultation message content must remain excluded from ordinary administrative access.

---

# 27. Current Prisma Foundation Mapping

The following entities are already represented in the current Foundation schema:

```text
User
Address
Pharmacy
PharmacyMember
Driver
```

The following entities are planned for later implementation phases:

```text
Order
OrderItem
PharmacyAssignment
Prescription
Payment
PaymentEvent
Delivery
DeliveryPricingSnapshot
DeliveryOTP
CashTransaction
Consultation
ConsultationMessage
Notification
AuditLog
```

These entities must be introduced according to the approved implementation order and must not bypass the SRS, Decision Log, Permission Matrix, or State Transition Matrix.

---

# 28. Schema Evolution Policy

Any structural database change must be reviewed against:

1. SRS v1.2
2. Decision Log
3. Permission Matrix
4. State Transition Matrix
5. OpenAPI
6. Automated tests

If a database change modifies business behavior, the relevant documentation must be updated before or together with the implementation.

No business-critical relationship should be introduced only because it is convenient for the frontend.

The database model must reflect the business domain rather than frontend screen structure.
