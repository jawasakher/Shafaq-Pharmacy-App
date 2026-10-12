# Discrepancies and Open Decisions (DISCREPANCIES-AND-OPEN-DECISIONS.md)

## 1. Resolved Discrepancies
* **Order Status Naming:** Reconciled state names to match backend Prisma schema exactly (`PHARMACY_REVIEWING`, `PHARMACY_CONFIRMED`, `CUSTOMER_CONFIRMATION_PENDING`, etc.).
* **Driver Communication:** Enforced SRS v1.2 rule prohibiting direct chat/calls between drivers and customers; communication is restricted to system status transitions and secure OTP handover.
* **Consultation Access:** Ensured consultation access is strictly restricted to assigned participants and verified roles via backend guards (`RolesGuard`).

## 2. Open Decisions & Assumptions
* **Local Development Fallback:** In the mobile app auth flow, a graceful offline/local dev fallback session was added to ensure seamless testing of UI screens when the external PostgreSQL database (Neon) is unreachable due to local network sandbox restrictions. This mock fallback is strictly for UI/UX testing and does not alter production backend contracts or database models.
