# Customer UI Software Requirements Specification (CUSTOMER-UI-SRS.md)

## 1. Scope & Actors
* **Actor:** Customer / Patient (`CUSTOMER` role)
* **Modules:** Authentication (OTP), Home, Medicine Requests, Prescriptions, Orders, Pricing Review, Payment, Delivery Tracking, Consultations, Account/Addresses.

## 2. Functional Requirements
* **CUST-01: Authentication (OTP)**
  * Input phone number -> Request OTP (`/auth/otp/request`) -> Enter challenge code (`/auth/otp/verify`) -> Establish customer session.
* **CUST-02: Customer Home (`(tabs)/index`)**
  * Display Shafaq branding, saved address summary (fetched from AsyncStorage/API), quick access to medicine request and consultation.
* **CUST-03: Medicine Request & Prescription Upload**
  * Add medicine items with quantities, upload prescription image to private storage, submit order (`POST /api/v1/orders`).
* **CUST-04: Order Pricing Review & Confirmation**
  * View pharmacy quote, accept or reject pricing (`CUSTOMER_CONFIRMATION_PENDING` -> `PAID`).
* **CUST-05: Order Tracking**
  * Live status tracking across the 11-stage order lifecycle.
* **CUST-06: Consultations**
  * Send health inquiries to assigned pharmacists and receive medical guidance.
