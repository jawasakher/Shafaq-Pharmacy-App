# 07 — Delivery Pricing Contract

## 1. Purpose

This document defines the authoritative contract for calculating the customer delivery fee in Shafaq.

It is part of the implementation baseline and must be consistent with the SRS, decision log, state-transition matrix, ERD, OpenAPI contract, and payment contract.

The core rule is:

> Calculate the delivery fee from authoritative delivery and pricing data, create a pricing snapshot for the order, and use that snapshot as the source for payment.

No frontend screen, controller, pharmacy, driver, or payment provider may independently calculate or override the delivery fee.

---

## 2. Source of Truth

The source-of-truth hierarchy is:

1. SRS and approved business decisions.
2. Delivery pricing contract.
3. Backend `DeliveryPricingService`.
4. Persisted delivery-pricing snapshot attached to the order/payment context.
5. API response derived from the authoritative backend calculation.
6. Frontend display only.

If a frontend value conflicts with the backend-calculated fee, the backend value wins.

A pricing rule change is a business-rule change and must follow the schema/state/API change policy.

---

## 3. DeliveryPricingService Boundary

The backend must expose a dedicated domain service concept:

`DeliveryPricingService`

Its responsibility is to:

- validate the origin and destination coordinates;
- calculate delivery distance according to the approved distance policy;
- determine whether the destination is supported;
- select the active pricing configuration;
- calculate the delivery fee;
- apply the required monetary rounding;
- return a complete pricing result;
- provide the data required to persist a delivery-pricing snapshot.

The service must not:

- trust a delivery fee supplied by the client;
- read pricing from frontend code;
- depend on a payment provider to calculate delivery fees;
- mutate order state by itself unless explicitly called from an order transaction;
- expose internal pricing configuration that is unnecessary for the customer.

---

## 4. Pricing Inputs

The authoritative calculation requires, at minimum:

### Origin

The responsible pharmacy's authoritative coordinates:

- latitude
- longitude

The responsible pharmacy is determined by the single `ACTIVE` `PharmacyAssignment`.

The client must not select an arbitrary pharmacy coordinate for pricing.

### Destination

The customer's delivery-address coordinates:

- latitude
- longitude

The destination must come from the authoritative order delivery-address data/snapshot.

### Pricing Configuration

The service reads the active backend pricing configuration, including the configured pricing strategy and its parameters.

Exact business amounts are intentionally not hardcoded in this contract because SRS v1.2 does not establish a final numeric price table.

---

## 5. Distance Calculation Policy

The service must use one deterministic distance method for a given pricing version.

The initial implementation should calculate geographic straight-line distance from the origin and destination coordinates using a documented geodesic method such as the Haversine formula.

The selected method must be:

- deterministic;
- documented;
- unit-consistent;
- independently testable;
- calculated on the backend.

The system must not silently switch between straight-line distance and road-route distance.

If road-network distance or routing-provider distance is introduced later, it is a pricing-policy change and requires an explicit contract/version update.

### Distance Unit

The internal calculation should use a precise numeric distance representation.

The pricing contract should define one canonical unit, preferably kilometres, while allowing the implementation to retain higher precision internally.

---

## 6. Pricing Strategy

The pricing engine must support configuration rather than embedding business numbers in controllers or frontend code.

A pricing configuration may represent a strategy such as:

- `FREE`
- `FLAT`
- `DISTANCE_BASED`
- `DISTANCE_TIERS`

The active strategy and its parameters are backend-controlled.

No specific monetary values are defined here until the business pricing decision is approved.

For a distance-based strategy, the conceptual formula may be:

`deliveryFee = baseFee + distanceCharge(distance)`

For tiered pricing, the service selects the configured tier using the authoritative calculated distance.

The exact formula, rates, thresholds, and currency must come from approved configuration/business decisions, not implementation assumptions.

---

## 7. Supported Delivery Area

The pricing service must determine whether the destination is serviceable.

If the destination is outside the supported delivery area, pricing must not return a normal payable fee.

Instead, the service returns a structured unsupported-area result that the order flow can handle explicitly.

The frontend must not determine serviceability by itself.

The supported-area policy may later be implemented using:

- maximum delivery distance;
- configured geographic zones;
- polygon/geofence rules;
- another approved backend policy.

The selected policy must be deterministic and versioned with the pricing configuration.

---

## 8. Invalid Coordinates

The pricing service must reject invalid pricing inputs, including:

- missing coordinates;
- non-numeric coordinates;
- latitude outside the valid range;
- longitude outside the valid range;
- coordinates that cannot produce a valid distance.

Invalid input is a validation/business error, not a zero-fee result.

The service must never silently convert invalid coordinates into a free delivery.

---

## 9. Monetary Precision and Rounding

Delivery fees must be handled as exact monetary values.

The implementation must not use binary floating-point arithmetic as the persisted monetary source of truth.

The persisted amount should use a fixed-precision decimal/numeric database type and an explicit currency.

Rounding must be applied according to one documented monetary rule at the final pricing boundary.

The same rounded amount must be used for:

- customer-visible delivery fee;
- order pricing;
- payment amount;
- payment reconciliation;
- audit/review of the pricing snapshot.

No frontend-side rounding may change the payable amount.

---

## 10. Pricing Snapshot

When the order reaches the point where delivery pricing becomes authoritative, the backend must persist a delivery-pricing snapshot.

The snapshot should contain enough information to reproduce and audit the calculation, including conceptually:

- pricing configuration/version identifier;
- pricing strategy;
- origin pharmacy identifier;
- origin latitude/longitude;
- destination latitude/longitude;
- calculated distance;
- distance unit;
- applicable pricing parameters or references;
- calculated delivery fee;
- currency;
- calculation timestamp;
- supported-area result.

The snapshot is historical data.

Later changes to active pricing configuration must not silently rewrite an existing order's historical pricing.

---

## 11. When Pricing Is Calculated

The backend may calculate a provisional quote before the order is finalized so the customer can see an expected delivery fee.

A provisional quote is not automatically a permanent financial record.

The authoritative snapshot must be created when the order flow reaches the business point where the delivery fee is locked for customer confirmation/payment, according to the order state machine.

The implementation must clearly distinguish:

- quote;
- authoritative order pricing;
- payment amount.

A quote must never be treated as paid-order history merely because it was displayed.

---

## 12. Recalculation Rules

Pricing may need recalculation when authoritative inputs change before the price is locked, including:

- responsible pharmacy changes through an approved transfer;
- delivery destination changes;
- pricing configuration/version changes before locking;
- an order leaves the pricing-validity window.

After the delivery fee becomes locked for customer confirmation/payment, it must not change implicitly.

Any post-lock change requires an explicit business exception and must follow the relevant order/payment/exception rules.

A pharmacy or frontend cannot request a hidden fee override.

---

## 13. Pharmacy Transfer

Because an order is fulfilled by one responsible pharmacy at a time, a transfer can change the pricing origin.

If an order is transferred and the new pharmacy becomes the active assignment, the backend must determine whether the existing delivery-pricing snapshot remains valid.

If the origin changes and pricing policy requires recalculation, the backend creates a new authoritative pricing result according to the order state and confirmation rules.

The system must never keep using a stale pharmacy-origin distance merely because a previous quote exists.

---

## 14. Customer Confirmation and Payment Boundary

The delivery fee is part of the amount presented for customer confirmation.

Once the customer confirms the final amount and the order proceeds into payment, the backend must use the authoritative pricing snapshot.

Payment requests must derive their delivery component from the persisted order pricing, not from client-submitted values.

The client may display:

- medicine subtotal;
- delivery fee;
- total amount.

The client must not be allowed to submit a replacement delivery fee.

---

## 15. Anti-Tampering Rules

The API must treat client-provided pricing fields as untrusted.

The backend must ignore or reject attempts to submit:

- arbitrary delivery fee;
- arbitrary distance;
- arbitrary pricing strategy;
- arbitrary pharmacy coordinates;
- arbitrary pricing configuration/version.

Only backend-authoritative data may determine the final fee.

This applies equally to:

- mobile clients;
- pharmacy clients;
- driver clients;
- admin clients;
- automated integrations.

Admin access does not imply permission to silently alter a locked order's historical delivery fee.

---

## 16. Concurrency and Consistency

Pricing must participate in the same consistency model as the order transition that makes it authoritative.

The implementation must prevent race conditions such as:

- two different active pharmacy assignments producing conflicting final prices;
- payment being created from a stale quote;
- a transfer changing the origin while payment uses the old origin;
- two pricing snapshots being treated as simultaneously authoritative;
- a pricing configuration change being applied halfway through one calculation.

Where required, the order/pricing/payment operation must use a transaction and appropriate concurrency controls.

There must be one clearly identifiable authoritative pricing snapshot for the payable order state.

---

## 17. API Contract

The API may expose a pricing quote endpoint or include pricing information in an order response.

Conceptually, a pricing result should provide:

- `distance`
- `distanceUnit`
- `deliveryFee`
- `currency`
- `pricingVersion`
- `supported`
- `quoteTimestamp`

Internal configuration details should not be exposed unless required.

The API contract must distinguish unsupported delivery areas and invalid inputs from ordinary successful pricing.

---

## 18. Error Categories

The implementation should provide stable domain-level error categories for at least:

- invalid coordinates;
- unsupported delivery area;
- pricing configuration unavailable;
- pricing configuration invalid;
- pricing calculation failure;
- stale/expired quote;
- pricing conflict caused by concurrent order changes.

Errors must use the standard API error envelope and requestId policy defined by the OpenAPI contract.

---

## 19. Testing Requirements

Before production use, test at least:

### Calculation

- identical origin/destination;
- short distance;
- longer distance;
- boundary distances;
- tier boundaries;
- rounding boundaries;
- valid decimal coordinates.

### Validation

- missing coordinates;
- invalid latitude;
- invalid longitude;
- non-numeric input;
- unsupported destination.

### Consistency

- pharmacy transfer before pricing lock;
- pharmacy transfer after pricing lock;
- destination change before lock;
- destination change after lock;
- pricing configuration version change;
- concurrent pricing and payment creation;
- duplicate pricing requests.

### Security

- client attempts to override fee;
- client attempts to override distance;
- client attempts to override pharmacy coordinates;
- client attempts to use another pricing version.

### Historical integrity

- changing current pricing configuration must not alter existing snapshots;
- payment must use the persisted authoritative amount;
- audit data must reproduce the pricing decision.

---

## 20. Observability and Audit

The system should log enough non-sensitive metadata to investigate pricing problems, including:

- order identifier;
- pricing configuration/version;
- origin pharmacy identifier;
- calculated distance;
- delivery fee;
- currency;
- calculation result;
- error category when applicable;
- timestamps;
- requestId/correlation identifier.

Sensitive customer information should not be unnecessarily copied into application logs.

Pricing snapshots are historical business records and must follow the retention policy.

---

## 21. Implementation Sequence

The recommended implementation order is:

1. Define the pricing configuration model.
2. Implement deterministic distance calculation.
3. Implement `DeliveryPricingService`.
4. Add supported-area validation.
5. Add explicit monetary rounding.
6. Add delivery-pricing snapshot persistence.
7. Integrate pricing into the Order domain.
8. Integrate payment using the persisted order amount.
9. Add concurrency/idempotency tests.
10. Add observability and audit coverage.

No provider-specific delivery-routing dependency is required for V1.

---

## 22. Change Policy

Any change to:

- pricing formula;
- pricing strategy;
- distance method;
- supported-area policy;
- rounding rule;
- currency;
- quote validity;
- price-lock point;
- snapshot semantics

must be treated as a contract/business-rule change.

The relevant SRS, decision log, state-transition matrix, ERD, OpenAPI contract, tests, and this document must be reviewed and updated as applicable.

---

## 23. Final Principle

> Delivery pricing is a backend domain decision: calculate it from authoritative pharmacy and customer delivery data, snapshot the result when it becomes financially authoritative, and use that snapshot consistently for customer confirmation, payment, reconciliation, and historical audit.
