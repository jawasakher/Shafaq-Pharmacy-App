# Requirements Traceability Matrix (REQUIREMENTS-TRACEABILITY.md)

| Req ID | Actor | Requirement Description | SRS v1.2 Business Rule | Backend API / DTO | UI Screen / Route |
|---|---|---|---|---|---|
| CUST-01 | Customer | OTP Authentication | Phone verification challenge | `/auth/otp/request`, `/auth/otp/verify` | `/auth/login` |
| CUST-02 | Customer | Home Dashboard | Navigation & Quick Actions | `/api/v1/me` | `/(tabs)/index` |
| CUST-03 | Customer | Medicine Request | Create order with items | `CreateOrderDto`, `POST /orders` | `/medicine-request` |
| CUST-04 | Customer | Pricing Confirmation | Customer approval of quote | Order state transition | Order Review screen |
| CUST-05 | Customer | Order Tracking | Lifecycle stage visibility | GET order endpoints | `/order-tracking` |
| PHAR-01 | Pharmacist | Operational Status | Toggle open/closed | Pharmacy service | `(pharmacist)/index` |
| PHAR-02 | Pharmacist | Order Review & Quote | Pharmacy pricing response | `PharmacyQuoteDto` | `(pharmacist)/index` |
| PHAR-03 | Pharmacist | Order Transfers | 10km radius, 15m timeout | Transfer config | `(pharmacist)/transfers` |
| PHAR-04 | Pharmacist | Consultations | Assigned consultations | Consultation service | `(pharmacist)/consultations` |
| DEL-01 | Driver | Available Tasks | Pickup ready orders | Delivery service | `(delivery)/index` |
| DEL-02 | Driver | Active Delivery & OTP | Handover confirmation | Verify OTP delivery DTO | `(delivery)/active` |
