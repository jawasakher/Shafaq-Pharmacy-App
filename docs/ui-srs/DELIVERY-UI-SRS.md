# Delivery UI Software Requirements Specification (DELIVERY-UI-SRS.md)

## 1. Scope & Actors
* **Actor:** Delivery Driver / Courier (`DRIVER` role)
* **Modules:** Available Tasks, Active Deliveries, OTP Handover Confirmation, Delivery History, Driver Account.

## 2. Functional Requirements
* **DEL-01: Available Delivery Tasks (`(delivery)/index`)**
  * Browse delivery offers dispatched for orders in `READY_FOR_PICKUP` state.
* **DEL-02: Active Deliveries (`(delivery)/active`)**
  * Accept delivery offer, track pickup and delivery progress, confirm handover via OTP verification.
* **DEL-03: Delivery History (`(delivery)/history`)**
  * Review completed deliveries and performance log.
* **DEL-04: Driver Account (`(delivery)/account`)**
  * Manage driver availability status (`OFFLINE`, `AVAILABLE`, `BUSY`) and secure logout.
* **DEL-05: Communication Restriction**
  * Per SRS v1.2, direct communication/chat between delivery drivers and customers is restricted; interaction is handled strictly through system status transitions and secure OTP handover.
