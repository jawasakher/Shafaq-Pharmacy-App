# Shafaq — Permission Matrix

## Purpose

This document defines the authorization boundaries for Shafaq v1.2.

Authorization is enforced by the backend.

The frontend may hide unavailable actions for usability, but hiding a UI element is not an authorization mechanism.

---

## Legend

- `YES` — Role may perform the action when all resource-specific conditions are satisfied.
- `NO` — Role must not perform the action.
- `ASSIGNED` — Only when the user is the assigned/resource-authorized actor.
- `MEMBER` — Only when the user is an active member of the relevant pharmacy.
- `OWNER` — Only the active pharmacy owner.
- `ADMIN` — Administrative authority, subject to privacy restrictions.

---

## 1. Identity

| Action | Customer | Owner | Pharmacist | Driver | Admin |
|---|---:|---:|---:|---:|---:|
| Authenticate with customer OTP | YES | NO | NO | NO | NO |
| Authenticate as internal user | NO | YES | YES | YES | YES |
| Manage own profile | YES | YES | YES | YES | YES |
| Manage another user's authentication | NO | NO | NO | NO | YES |

---

## 2. Addresses

| Action | Customer | Owner | Pharmacist | Driver | Admin |
|---|---:|---:|---:|---:|---:|
| Create own address | YES | YES | YES | YES | YES |
| Update own address | YES | YES | YES | YES | YES |
| Delete own address | YES | YES | YES | YES | YES |
| Read another user's address | NO | NO | NO | NO | ADMIN |

Resource access must still follow the applicable privacy and operational rules.

---

## 3. Pharmacy Registration and Approval

| Action | Customer | Owner | Pharmacist | Driver | Admin |
|---|---:|---:|---:|---:|---:|
| Submit pharmacy registration | NO | YES | NO | NO | YES |
| Read own pharmacy application | NO | YES | NO | NO | YES |
| Approve pharmacy | NO | NO | NO | NO | YES |
| Reject pharmacy | NO | NO | NO | NO | YES |
| Suspend pharmacy | NO | NO | NO | NO | YES |
| Change pharmacy operational status | NO | OWNER | NO | NO | YES |

A pharmacy must have:

`approvalStatus = APPROVED`

before its operational status can make it eligible to receive new orders.

---

## 4. Pharmacy Membership

| Action | Customer | Owner | Pharmacist | Driver | Admin |
|---|---:|---:|---:|---:|---:|
| Read own pharmacy membership | NO | MEMBER | MEMBER | NO | ADMIN |
| Add pharmacist | NO | OWNER | NO | NO | YES |
| Remove pharmacist | NO | OWNER | NO | NO | YES |
| Change pharmacist membership status | NO | OWNER | NO | NO | YES |
| Manage pharmacy ownership | NO | OWNER | NO | NO | ADMIN |

Membership must be active for membership-based permissions.

---

## 5. Pharmacy Orders

| Action | Customer | Owner | Pharmacist | Driver | Admin |
|---|---:|---:|---:|---:|---:|
| Create medicine order | YES | NO | NO | NO | NO |
| View own order | YES | NO | NO | NO | NO |
| Review pharmacy order | NO | MEMBER | MEMBER | NO | YES |
| Confirm pharmacy availability | NO | MEMBER | MEMBER | NO | YES |
| Set medicine price | NO | MEMBER | MEMBER | NO | YES |
| Reject pharmacy fulfillment | NO | MEMBER | MEMBER | NO | YES |
| Prepare confirmed order | NO | MEMBER | MEMBER | NO | YES |

Pharmacy order actions require an appropriate active pharmacy membership and valid order assignment.

---

## 6. Pharmacy Transfer

| Action | Customer | Owner | Pharmacist | Driver | Admin |
|---|---:|---:|---:|---:|---:|
| Request transfer | NO | MEMBER | MEMBER | NO | YES |
| Accept transfer | NO | MEMBER | MEMBER | NO | YES |
| Reject transfer | NO | MEMBER | MEMBER | NO | YES |
| Force arbitrary transfer | NO | NO | NO | NO | ADMIN |

A receiving pharmacy must explicitly accept the transferred order.

---

## 7. Payments

| Action | Customer | Owner | Pharmacist | Driver | Admin |
|---|---:|---:|---:|---:|---:|
| Initiate customer payment | YES | NO | NO | NO | NO |
| Confirm own payment result | YES | NO | NO | NO | NO |
| Process provider webhook | NO | NO | NO | NO | SYSTEM |
| Reconcile unknown payment | NO | NO | NO | NO | ADMIN |

The payment provider integration is isolated behind the payment adapter.

---

## 8. Delivery

| Action | Customer | Owner | Pharmacist | Driver | Admin |
|---|---:|---:|---:|---:|---:|
| View own delivery status | YES | NO | NO | NO | YES |
| Become available for delivery | NO | NO | NO | DRIVER | NO |
| Accept delivery | NO | NO | NO | DRIVER | NO |
| Update delivery progression | NO | NO | NO | DRIVER | ADMIN |
| Confirm pharmacy handover | NO | MEMBER | MEMBER | DRIVER | YES |
| Confirm pickup | NO | NO | NO | DRIVER | YES |
| Enter delivery OTP | YES | NO | NO | DRIVER | YES |
| Resolve cash exception | NO | NO | NO | DRIVER + ADMIN | ADMIN |

Driver actions require:

`approvalStatus = APPROVED`

and the appropriate driver availability state.

---

## 9. Driver Availability

| Action | Customer | Owner | Pharmacist | Driver | Admin |
|---|---:|---:|---:|---:|---:|
| Set own availability | NO | NO | NO | YES | YES |
| Become AVAILABLE | NO | NO | NO | YES | YES |
| Become BUSY | NO | NO | NO | SYSTEM | ADMIN |
| Return to OFFLINE | NO | NO | NO | YES | YES |

A driver with an active delivery cannot arbitrarily become `OFFLINE`.

---

## 10. Consultation

| Action | Customer | Owner | Pharmacist | Driver | Admin |
|---|---:|---:|---:|---:|---:|
| Create consultation | YES | NO | NO | NO | NO |
| View own consultation | YES | NO | NO | NO | NO |
| Assign pharmacist | NO | OWNER | OWNER | NO | YES |
| Read consultation content | CUSTOMER | NO | ASSIGNED | NO | NO |
| Send consultation message | CUSTOMER | NO | ASSIGNED | NO | NO |
| Complete consultation | NO | NO | ASSIGNED | NO | NO |
| Cancel own consultation where allowed | YES | NO | ASSIGNED | NO | ADMIN |

The owner does not gain consultation-content access merely because they own the pharmacy.

Administrators must not read consultation chat content in the normal workflow.

---

## 11. Prescriptions

| Action | Customer | Owner | Pharmacist | Driver | Admin |
|---|---:|---:|---:|---:|---:|
| Upload own prescription | YES | NO | NO | NO | NO |
| View prescription for own order | YES | NO | ASSIGNED | NO | NO |
| Access prescription URL | YES | NO | ASSIGNED | NO | NO |
| Manage prescription versions | YES | NO | ASSIGNED | NO | NO |

Prescription access uses private storage and temporary signed URLs.

---

## 12. Administration

| Action | Customer | Owner | Pharmacist | Driver | Admin |
|---|---:|---:|---:|---:|---:|
| Manage users | NO | NO | NO | NO | YES |
| Manage pharmacy approvals | NO | NO | NO | NO | YES |
| Manage driver approvals | NO | NO | NO | NO | YES |
| View operational audit data | NO | NO | NO | NO | YES |
| Read consultation chat | NO | NO | NO | NO | NO |
| Modify arbitrary business state | NO | NO | NO | NO | NO |

Admin authority does not override consultation privacy.

---

## 13. Important Authorization Rules

### Pharmacy access

An owner or pharmacist must have an active `PharmacyMember` record for the relevant pharmacy.

### Owner access

Owner permissions are limited to the pharmacy they own.

### Pharmacist access

A pharmacist may access consultation content only when they are the assigned pharmacist.

### Driver access

A driver may operate only on deliveries assigned to that driver and only while the delivery state permits the action.

### Customer access

A customer may access only their own:

- Profile
- Addresses
- Orders
- Prescriptions
- Consultations
- Payment records
- Delivery information

### Administrator privacy

Administrative access must not be used to read private consultation chat content in the normal workflow.

---

## 14. Backend Enforcement

Every protected endpoint must enforce authorization server-side.

The system must validate:

1. Authenticated identity
2. Global role
3. Resource ownership or membership
4. Assignment where required
5. Current state
6. Allowed state transition
7. Relevant privacy boundary

A valid role alone must never be treated as sufficient authorization for another user's private resource.
