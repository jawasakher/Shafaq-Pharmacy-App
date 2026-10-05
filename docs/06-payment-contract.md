# Shafaq — Payment Contract

## 1. Purpose

This document defines the canonical internal payment contract for Shafaq v1.2.

It separates:
1. Shafaq payment domain rules
2. Payment provider integration
3. Provider-specific authentication and API details
4. Webhook processing
5. Reconciliation
6. Idempotency
7. Failure and UNKNOWN handling

The payment provider for V1 is intended to be **Sham Cash**, but no provider-specific API, authentication, webhook signature, endpoint, or payload is assumed here until verified against official provider documentation.

## 2. Source of Truth

Payment behavior is governed by:
1. SRS v1.2
2. Decision Log
3. State Transition Matrix
4. ERD
5. This payment contract
6. Verified provider documentation

If provider behavior conflicts with Shafaq business rules, the integration layer must adapt to the provider. Business rules are not changed implicitly.

## 3. Payment Domain Model

A payment belongs to exactly one order.

Conceptually:

~~~text
Order
  |
  └── Payment
        |
        ├── Payment attempts / provider references
        └── Payment events
~~~

The payment record is the internal source of truth for the current payment state.

Provider responses and webhooks are external evidence and must be reconciled into the internal state machine.

## 4. Payment Status

Canonical internal states:

~~~text
PENDING
PROCESSING
PAID
FAILED
UNKNOWN
REFUNDED
~~~

### PENDING
Payment has been created but has not yet reached a confirmed processing state.

### PROCESSING
The provider has indicated that the payment is being processed.

### PAID
Payment has been positively confirmed by trusted provider evidence or reconciliation.

Only PAID satisfies the order paid invariant.

### FAILED
Payment has been positively determined to have failed.

A timeout, network error, missing webhook, or ambiguous response must not automatically become FAILED.

### UNKNOWN
The outcome cannot currently be established with sufficient confidence.

Examples:
- Provider timeout after request submission
- Network failure after provider acceptance may have occurred
- Provider API temporarily unavailable
- Conflicting or incomplete provider responses
- Missing webhook where final provider state cannot yet be established

UNKNOWN is an operational state, not a synonym for failure.

### REFUNDED
A previously PAID payment was explicitly refunded under the applicable exception/refund policy.

REFUNDED is not a normal order cancellation mechanism.

## 5. Order Payment Invariant

The order may enter PAID only when the backend has an authoritative internal payment state of PAID.

The following do not satisfy the paid invariant:

~~~text
PENDING
PROCESSING
FAILED
UNKNOWN
~~~

A frontend success screen is never sufficient evidence of payment.

## 6. Payment Provider Adapter

The application must use a provider adapter boundary.

Recommended interface:

~~~ts
interface PaymentProvider {
  createPayment(input: CreateProviderPaymentInput): Promise<ProviderPaymentResult>;
  getPayment(providerPaymentId: string): Promise<ProviderPaymentResult>;
  verifyWebhook(input: VerifyWebhookInput): Promise<VerifiedWebhookResult>;
  refundPayment?(input: RefundProviderPaymentInput): Promise<ProviderRefundResult>;
}
~~~

Exact method names may change during implementation, but the architectural boundary must remain.

The domain layer must not depend directly on Sham Cash HTTP details.

## 7. Internal Payment Service

The application service should expose provider-independent operations such as:

~~~ts
createPayment(orderId, idempotencyKey)
getPaymentStatus(paymentId)
handleProviderWebhook(provider, request)
reconcilePayment(paymentId)
requestRefund(paymentId, reason)
~~~

Provider-specific data remains behind the adapter.

## 8. Payment Creation Contract

Minimum internal input:

~~~json
{
  "orderId": "uuid",
  "amount": 0,
  "currency": "string",
  "idempotencyKey": "string"
}
~~~

The backend calculates and validates the amount.

For V1, the payment amount must equal the persisted authoritative Order
pricing:

`totalAmount = medicineSubtotal + deliveryFee`

The backend must calculate and persist `totalAmount` and `currency` before the
payment boundary. Payment must use only those persisted values and must never
trust a client-supplied amount or currency. The V1 currency value remains a
pending business decision.

The frontend must not be trusted as the source of:
- medicine subtotal
- delivery fee
- total payable amount
- payment state

Before creating a payment:
1. Order exists.
2. Current user is authorized.
3. Order belongs to the customer initiating payment.
4. Order is in PAYMENT_PENDING.
5. Order has a valid confirmed price.
6. Delivery pricing snapshot exists where required.
7. Total amount is internally calculated.
8. No incompatible active payment attempt exists.
9. Idempotency key is validated.
10. Transaction/concurrency rules are enforced.

## 9. Idempotency

Payment creation must be idempotent.

A repeated request with the same logical idempotency key must not create multiple provider charges.

Conceptually:

~~~text
same order + same idempotency key
        ↓
same internal payment attempt
        ↓
no duplicate charge
~~~

The database must enforce uniqueness for the idempotency key within the appropriate payment scope.

A retry after a timeout must reuse the same idempotency identity.

## 10. Provider Request Lifecycle

~~~text
Order
  ↓
PAYMENT_PENDING
  ↓
Create internal payment attempt
  ↓
Call provider adapter
  ↓
Persist provider reference/result
  ↓
PENDING / PROCESSING / PAID / FAILED / UNKNOWN
~~~

If the provider may have accepted the payment but the response was not confirmed, the result must be UNKNOWN until reconciliation.

## 11. Webhook Contract

Provider webhooks are external events.

The webhook handler must:
1. Authenticate/verify the provider webhook.
2. Identify the provider.
3. Extract the provider event ID.
4. Reject malformed events safely.
5. Store the event idempotently.
6. Locate the internal payment.
7. Validate the event against the payment/provider reference.
8. Apply the corresponding internal state transition.
9. Record the processing result.
10. Return an appropriate provider response.

Provider-specific signature verification remains unspecified until official documentation is verified.

## 12. Webhook Idempotency

The provider event identifier must be unique within the provider event namespace.

Duplicate delivery must not:
- create duplicate payments
- move state backward
- create duplicate audit events
- duplicate refunds
- duplicate order transitions

Conceptually:

~~~text
provider + providerEventId
        ↓
unique
        ↓
process once
~~~

## 13. Out-of-Order Events

Webhook order must not be blindly trusted.

Example:

~~~text
PAID webhook
↓
PROCESSING webhook arrives later
~~~

The later event must not move PAID back to PROCESSING.

State transitions must be validated against the payment state machine. Reconciliation must be used where provider ordering cannot be established safely.

## 14. UNKNOWN and Reconciliation

UNKNOWN payments require an explicit reconciliation path.

~~~text
UNKNOWN
   ↓
reconciliation job/manual trigger
   ↓
provider status lookup
   ↓
trusted result
   ├── PAID
   ├── FAILED
   └── still UNKNOWN
~~~

Reconciliation must be safe to retry and must not create duplicate provider charges.

## 15. Payment Timeout Policy

Timeouts are not equivalent to payment failure.

If a payment request may have reached the provider but the response was not confirmed:

~~~text
UNKNOWN
~~~

is preferred over FAILED.

The payment remains blocked from paid-only fulfillment until resolved.

## 16. Security Requirements

Payment endpoints must:
- Require authentication where applicable.
- Authorize the customer against the order.
- Never trust client-submitted total amounts.
- Never expose provider secrets.
- Never log full payment credentials.
- Never store provider credentials in the database unless explicitly required by the verified provider contract.
- Validate webhook authenticity before state mutation.
- Use TLS for provider communication.
- Protect idempotency keys.
- Record request IDs for traceability.

Provider secrets belong in environment/secret management, not source control.

## 17. Persisted Payment Data

The internal Payment entity may contain:

~~~text
id
orderId
provider
providerPaymentId
status
amount
currency
idempotencyKey
createdAt
updatedAt
~~~

PaymentEvent may contain:

~~~text
id
paymentId
provider
providerEventId
eventType
raw/normalized event metadata as permitted by retention policy
receivedAt
processedAt
processingStatus
~~~

Exact fields remain subject to final ERD/schema implementation.

## 18. Provider Reference Rules

A provider payment identifier must be stored when supplied.

It is used for:
- status lookup
- reconciliation
- webhook correlation
- provider-side refund where supported

A provider reference must not be replaced merely because a retry occurred.

## 19. Amount and Currency Integrity

Payment amount must be derived from authoritative order totals.

Conceptually:

~~~text
Medicine subtotal
+ Delivery fee
= Payable total
~~~

The delivery fee must come from the delivery pricing snapshot.

The payment amount must use a precise monetary representation.

Recommended implementation:
- PostgreSQL NUMERIC/DECIMAL
- Prisma Decimal
- or integer minor units where appropriate and consistent

The final implementation must use one consistent representation.

## 20. Payment and Delivery Boundary

Online medicine payment and cash collection are separate concepts.

~~~text
Payment.status = PAID
~~~

does not mean:

~~~text
CashStatus = RECEIVED
~~~

The delivery cash workflow remains independent according to the SRS.

## 21. Refund Boundary

Normal customer cancellation/refund is not introduced after the order reaches the locked paid workflow.

A refund can occur only through an explicitly authorized exception/refund policy.

Refund processing must be:
- authorized
- idempotent
- auditable
- linked to the original payment
- reconciled with the provider

## 22. Payment State Transition Rules

Canonical transitions include:

~~~text
PENDING → PROCESSING
PROCESSING → PAID
PROCESSING → FAILED
PROCESSING → UNKNOWN
UNKNOWN → PAID
UNKNOWN → FAILED
PAID → REFUNDED
~~~

Invalid examples:

~~~text
PAID → PROCESSING
PAID → FAILED
REFUNDED → PAID
~~~

The exact transition matrix remains governed by docs/03-state-transition-matrix.md.

## 23. Concurrency

Payment operations must be transaction-safe.

### Double payment request

~~~text
Request A ─┐
           ├── same order
Request B ─┘
~~~

Only one valid payment attempt may become authoritative according to the payment policy.

### Duplicate webhook

~~~text
Webhook A ─┐
           ├── same provider event
Webhook B ─┘
~~~

Only one event processing result may mutate the payment state.

### Payment + order transition

The system must prevent an order from becoming PAID without authoritative payment.status = PAID.

## 24. Error Categories

Recommended internal error codes:

~~~text
PAYMENT_NOT_FOUND
PAYMENT_NOT_ALLOWED
PAYMENT_ALREADY_EXISTS
PAYMENT_INVALID_STATE
PAYMENT_PROVIDER_UNAVAILABLE
PAYMENT_PROVIDER_REJECTED
PAYMENT_UNKNOWN
PAYMENT_WEBHOOK_INVALID
PAYMENT_WEBHOOK_DUPLICATE
PAYMENT_RECONCILIATION_REQUIRED
PAYMENT_IDEMPOTENCY_CONFLICT
PAYMENT_AMOUNT_MISMATCH
PAYMENT_UNAUTHORIZED
~~~

Sensitive provider internals must not be exposed.

## 25. Observability

Every payment operation should be traceable through:

~~~text
requestId
paymentId
orderId
provider
providerPaymentId
providerEventId
~~~

Logs must support diagnosis without exposing secrets or sensitive credentials.

Important state mutations should produce audit records where required.

## 26. Provider Integration Boundary

The Sham Cash adapter must be implemented only after official provider information has been verified.

The following must not be invented:
- API base URL
- endpoint paths
- API key names
- authentication scheme
- request payload
- response payload
- webhook URL contract
- webhook signature algorithm
- event names
- refund endpoint
- settlement behavior
- sandbox behavior

Until verified, the integration remains an adapter contract rather than a concrete provider implementation.

## 27. Testing Requirements

Before real payment traffic, tests must cover:

### Success
- Payment creation succeeds.
- Provider confirms PAID.
- Order moves to PAID exactly once.

### Failure
- Provider explicitly rejects payment.
- Payment becomes FAILED.
- Order does not enter PAID.

### Timeout
- Provider request times out.
- Payment becomes UNKNOWN.
- Order remains blocked from paid-only fulfillment.

### Retry
- Same idempotency key is retried.
- No duplicate charge is created.

### Webhook
- Valid webhook updates payment.
- Duplicate webhook is harmless.
- Invalid webhook is rejected.
- Out-of-order event cannot regress state.

### Reconciliation
- UNKNOWN becomes PAID after provider lookup.
- UNKNOWN becomes FAILED after provider lookup.
- Still UNKNOWN remains unresolved.

### Concurrency
- Two payment requests race.
- Only one authoritative payment attempt is created.
- Two identical webhooks race.
- State remains correct.

### Security
- Customer cannot pay another customer's order.
- Unauthenticated payment access fails.
- Invalid webhook signature cannot mutate payment state.
- Provider secrets never appear in logs or responses.

## 28. Implementation Order

~~~text
1. Payment schema
2. Payment state machine
3. Idempotency constraints
4. Payment domain service
5. Provider adapter interface
6. Provider configuration
7. Verified Sham Cash adapter
8. Webhook verification
9. Webhook event persistence
10. Reconciliation
11. API endpoints
12. Concurrency tests
13. Integration tests
14. Production secrets/configuration
~~~

Do not implement provider-specific code before official provider documentation is verified.

## 29. Contract Change Policy

Any change to:
- payment states
- payment transitions
- refund behavior
- amount calculation
- idempotency rules
- provider boundary
- webhook semantics

requires synchronized updates to:

~~~text
SRS
Decision Log
State Transition Matrix
ERD
OpenAPI
Payment Contract
Concurrency Tests
Exception Policy
~~~

No payment behavior may be changed in code alone.

## 30. Final Payment Principle

~~~text
Order business rules
        ↓
Payment state machine
        ↓
Database constraints
        ↓
Idempotent transaction
        ↓
Provider adapter
        ↓
Verified provider evidence
        ↓
Reconciliation when necessary
        ↓
Order state transition
~~~

The frontend is never authoritative for payment success.
A timeout is not automatically a failure.
UNKNOWN is a first-class state.
Provider-specific details must be verified before implementation.
