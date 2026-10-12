# Pharmacy UI Software Requirements Specification (PHARMACY-UI-SRS.md)

## 1. Scope & Actors
* **Actor:** Pharmacist / Pharmacy Owner (`PHARMACIST` / `OWNER` roles)
* **Modules:** Operational Status, Order Review, Quote & Dispensing, Prescription Verification, Order Transfers, Consultations, Account.

## 2. Functional Requirements
* **PHAR-01: Operational Status Toggle**
  * Switch pharmacy operational status between `OPEN` and `CLOSED`.
* **PHAR-02: Order Review & Pricing (`(pharmacist)/index`)**
  * View assigned orders in `PHARMACY_REVIEWING` state, verify prescription, and submit item-level availability and pricing quote (`PharmacyQuoteDto`).
* **PHAR-03: Order Transfers (`(pharmacist)/transfers`)**
  * Broadcast unfulfillable orders to nearby partner pharmacies within the configured radius (`TRANSFER_RADIUS_KM` = 10km, 15-minute expiration window) per SRS v1.2.
* **PHAR-04: Consultations (`(pharmacist)/consultations`)**
  * Access assigned patient consultations securely and respond with pharmaceutical guidance.
* **PHAR-05: Pharmacist Profile (`(pharmacist)/account`)**
  * View membership details and perform secure logout.
