# Shafaq UI Software Requirements Specification (SHAFaq-UI-SRS-v1.0)

## 1. Executive Summary & Architecture Overview
Shafaq (شَفَق) is an Arabic-first digital healthcare and pharmacy delivery platform. This document establishes the authoritative UI/UX requirements reconciled with the backend architecture (NestJS, Prisma, PostgreSQL) and the SRS v1.2 business rules.

## 2. Global Design System & Identity
* **Brand Name:** شَفَق ("نورُ الرعاية الطبية")
* **Palette:** Light cyan, sky-blue, aqua, and clean white (`#F4FCFE`, `#19A9CC`, `#16485C`, `#688795`).
* **Directionality:** Strict Right-to-Left (RTL) layout.
* **Component Standards:** Centralized design tokens, reusable UI components (`ShafaqCard`, `ScreenHeader`, `PrimaryButton`, `SecondaryButton`, `LoadingState`, `ErrorState`, `EmptyState`).

## 3. Order Lifecycle State Machine (SRS v1.2)
1. `PENDING`: Order created by customer, awaiting pharmacy review.
2. `PHARMACY_REVIEWING`: Pharmacy is reviewing the order and items.
3. `PHARMACY_CONFIRMED`: Pharmacy confirmed availability and pricing.
4. `CUSTOMER_CONFIRMATION_PENDING`: Awaiting customer approval of pricing/quote.
5. `PAYMENT_PENDING`: Awaiting payment initiation.
6. `PAID`: Payment successfully processed.
7. `PHARMACY_PREPARING`: Pharmacy is preparing/dispensing the medicine.
8. `READY_FOR_PICKUP`: Order packaged and ready for driver pickup.
9. `IN_DELIVERY`: Dispatched to driver and en route to customer.
10. `DELIVERED`: Delivered to customer address with OTP handover verification.
11. `COMPLETED`: Order successfully closed.
12. `CLOSED` / `EXCEPTION`: Terminal or exceptional states (e.g., transfers, cancellations).
