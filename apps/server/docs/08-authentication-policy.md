# 08 — Authentication Policy

## 1. Purpose

This document defines the authentication policy for Shafaq and establishes the security boundary between authentication and authorization.

It is an implementation contract and must remain consistent with:

- SRS v1.2
- Decision Log
- Permission Matrix
- State Transition Matrix
- ERD
- OpenAPI contract
- Payment Contract
- Delivery Pricing Contract

The core rule is:

> Authentication proves who the caller is; authorization determines what that authenticated identity is allowed to do.

The backend is the final authority for both identity and authorization.

---

## 2. Authentication Sources

Shafaq has two authentication categories.

### 2.1 Customer Authentication

Customers authenticate using:

- phone number;
- one-time password (OTP);
- secure authenticated session/token after successful verification.

The customer flow is intended for the customer mobile application.

### 2.2 Internal User Authentication

Internal users authenticate through a secure session-based mechanism suitable for:

- pharmacy owners;
- pharmacists;
- drivers;
- administrators.

The exact session/token implementation may be selected during Foundation/Identity implementation, but it must satisfy the security requirements in this contract.

Internal authentication must not rely on client-controlled role fields.

---

## 3. Authentication vs Authorization

Authentication establishes the authenticated user identity.

Authorization is performed independently using backend data.

The backend must determine permissions from authoritative persisted data such as:

- authenticated user identifier;
- `User.role`;
- active `PharmacyMember` membership;
- membership role;
- pharmacy approval status;
- pharmacy operational status;
- driver approval status;
- driver availability status;
- order ownership/assignment;
- consultation assignment;
- current state-machine state.

The client must never be trusted to declare:

- its role;
- pharmacy ownership;
- pharmacist assignment;
- driver approval;
- admin privileges;
- order ownership.

---

## 4. Customer Phone Authentication

The customer authentication flow is:

1. Customer submits a phone number.
2. Backend validates and normalizes the phone number.
3. Backend generates a short-lived OTP.
4. OTP is delivered through the approved OTP channel.
5. Customer submits the OTP.
6. Backend verifies the OTP.
7. Backend creates or retrieves the customer identity.
8. Backend establishes an authenticated session/token.
9. Subsequent API calls use the authenticated identity.

The exact OTP delivery provider is intentionally not fixed by this document unless separately approved.

---

## 5. OTP Security

OTP values must be treated as secrets.

The backend must:

- generate cryptographically secure OTPs;
- store only a secure representation/hash when persistence is required;
- never log the plaintext OTP;
- apply expiration;
- apply verification-attempt limits;
- apply request rate limits;
- invalidate the OTP after successful verification;
- ensure only the latest valid OTP can be accepted according to the OTP policy;
- prevent replay;
- provide generic responses that do not unnecessarily reveal account existence.

OTP generation and verification must be server-side.

The client must never generate or validate its own authentication OTP.

---

## 6. OTP Expiration and Rate Limiting

OTP lifetime must be short and configurable.

The implementation must define and enforce limits for:

- OTP requests per phone number;
- OTP requests per device/IP or equivalent abuse-control dimension;
- verification attempts per OTP;
- repeated failed authentication attempts;
- temporary lockout/backoff where required.

Exact numeric limits should be configurable security policy values rather than scattered constants in controllers.

Security limits must be observable without exposing OTP secrets.

---

## 7. Phone Number Normalization

Phone numbers must be normalized into one canonical representation before identity lookup or creation.

Normalization must occur server-side.

Equivalent representations of the same phone number must not create multiple customer identities.

The normalized phone number is the authoritative identity key for customer phone authentication.

Phone numbers must not be used as plaintext identifiers in logs where a safer representation is sufficient.

---

## 8. Customer Session

After successful OTP verification, the backend establishes an authenticated customer session/token.

The session mechanism must provide:

- authenticated user identity;
- expiration;
- secure renewal/refresh behavior if refresh tokens are used;
- revocation capability where required;
- protection against token replay;
- server-side authorization on every protected request.

A client must not remain trusted merely because it previously completed OTP verification.

---

## 9. Internal User Sessions

Pharmacy owners, pharmacists, drivers, and admins require secure authenticated sessions.

The implementation may use a standards-based session/token mechanism, provided that it supports:

- strong authentication;
- secure session storage;
- expiration;
- revocation;
- rotation where applicable;
- protection against token theft/replay;
- backend authorization on every protected request.

The exact identity/session provider may be selected during Identity implementation.

Provider-specific details must not be invented in this document.

---

## 10. Admin MFA

Admin accounts must require multi-factor authentication in production.

MFA must provide an additional factor beyond the primary credential/session authentication.

The implementation must support:

- enrollment;
- verification;
- recovery policy;
- secure secret handling;
- rate limiting;
- revocation/reset under controlled procedures.

MFA bypass must not be implemented as a normal application flow.

A development-only bypass, if ever required, must be explicitly isolated from production configuration and must not weaken production authentication.

---

## 11. Internal Role Authority

The authoritative internal roles are:

- `OWNER`
- `PHARMACIST`
- `DRIVER`
- `ADMIN`

A user's role must be resolved from backend identity data.

For pharmacy access, `PharmacyMember.role` is the authoritative pharmacy membership role.

The system must not infer pharmacy ownership solely from:

- phone number;
- pharmacy ID supplied by the client;
- frontend navigation;
- a user-provided role string.

---

## 12. Pharmacy Membership Authorization

A pharmacy owner or pharmacist may access a pharmacy only when the backend confirms an appropriate active `PharmacyMember` record.

Required conditions include:

- authenticated user;
- matching pharmacy membership;
- membership status = `ACTIVE`;
- appropriate membership role for the requested action.

For pharmacy ownership:

- `PharmacyMember.role = OWNER`

For pharmacist work:

- `PharmacyMember.role = PHARMACIST`

A user may have memberships in multiple pharmacies only according to approved business rules; every request must resolve the specific authorized pharmacy context.

---

## 13. Pharmacy Approval Boundary

Authentication does not imply that a pharmacy is operational.

A pharmacy may receive new customer orders only when:

- `approvalStatus = APPROVED`
- and `operationalStatus = OPEN`

A pharmacy may be authenticated while:

- pending approval;
- rejected;
- suspended;
- closed.

Those statuses must be enforced by authorization/business rules where relevant.

---

## 14. Driver Authentication and Approval

A driver must have:

- an authenticated user identity;
- a valid driver profile;
- `approvalStatus = APPROVED`

Only an approved driver may enter the active delivery workflow.

Driver availability is separate from authentication:

- `OFFLINE`
- `AVAILABLE`
- `BUSY`

Authentication does not automatically make a driver available.

The backend must enforce driver state transitions.

---

## 15. Admin Authorization

Admin authentication does not grant unrestricted access to every piece of application data.

Admin permissions are defined by the Permission Matrix.

In particular, normal admin workflows must not provide access to private consultation chat content.

Admin authorization must be explicit and endpoint/action-specific.

---

## 16. Consultation Privacy

Consultation authentication and authorization must enforce private access between:

- the customer;
- the assigned pharmacist.

The owner of a pharmacy does not automatically gain consultation-content access merely because they own the pharmacy.

If an owner is also the assigned pharmacist for a consultation, access is granted through the pharmacist assignment that is authoritative for that consultation.

Admin users must not read consultation chat content through normal administrative permissions.

Authentication middleware must not accidentally expose consultation data through broad administrative endpoints.

---

## 17. Resource-Level Authorization

Authentication guards are not sufficient by themselves.

Protected resources must apply resource-level authorization.

Examples:

### Customer

A customer may access only their own:

- profile;
- addresses;
- orders;
- prescriptions;
- payment records where permitted;
- consultations where they are the customer;
- notifications.

### Pharmacy Owner

An owner may access only authorized pharmacy resources and actions permitted by the Permission Matrix.

### Pharmacist

A pharmacist may access only:

- authorized pharmacy data;
- assigned consultations;
- order/pharmacy workflows permitted by their role.

### Driver

A driver may access only delivery resources assigned or offered to them according to the delivery state machine and driver policy.

### Admin

An admin may access administrative resources explicitly permitted by the Permission Matrix.

---

## 18. Session Revocation

The backend must support revocation/invalidation when security or lifecycle conditions require it.

Examples include:

- explicit logout where server-side revocation is applicable;
- credential/session compromise;
- account suspension;
- account deactivation;
- administrative security action;
- refresh-token rotation failure;
- forced reauthentication.

Revocation behavior must be consistent across protected API endpoints.

---

## 19. Logout

Logout must invalidate the authenticated session/token according to the selected authentication mechanism.

The client may remove its local credentials, but client-side deletion alone is not sufficient where the backend maintains revocable sessions or refresh tokens.

After logout, previously valid credentials must not continue to provide access when they are intended to be revoked.

---

## 20. Token and Session Storage

Secrets and session credentials must be stored using platform-appropriate secure storage.

For mobile applications:

- do not store authentication secrets in plain application storage;
- use the platform secure credential/keychain mechanism;
- do not include tokens in URLs;
- do not log authorization headers.

For web/admin clients:

- use secure cookie/session practices where cookie-based authentication is selected;
- protect against XSS, CSRF, and session theft according to the selected mechanism.

---

## 21. Transport Security

All production authentication traffic must use HTTPS/TLS.

The application must not send:

- OTPs;
- passwords/credentials;
- access tokens;
- refresh tokens;
- session secrets

over unencrypted production HTTP.

Local development may use localhost HTTP where technically necessary, but production configuration must not depend on it.

---

## 22. Authentication Error Policy

Authentication failures must return stable API error responses without unnecessarily disclosing sensitive information.

Examples:

- invalid OTP;
- expired OTP;
- too many OTP attempts;
- authentication required;
- invalid/expired session;
- session revoked;
- MFA required;
- invalid MFA code;
- account suspended.

The API should avoid revealing whether a phone number belongs to an account when such disclosure would create an account-enumeration risk.

All authentication errors must follow the standard error envelope and requestId policy.

---

## 23. Authorization Failure Policy

The backend must distinguish authentication failure from authorization failure where appropriate.

Conceptually:

- unauthenticated caller → authentication required;
- authenticated caller without permission → forbidden;
- authenticated caller attempting to access another user's resource → authorization failure;
- authenticated internal user without required pharmacy membership → authorization failure.

The exact HTTP/API mapping follows the OpenAPI contract.

---

## 24. Brute-Force and Abuse Protection

Authentication endpoints are security-sensitive and must have abuse controls.

At minimum, apply rate limiting to:

- OTP request;
- OTP verification;
- MFA verification;
- session/credential endpoints;
- repeated failed authentication attempts.

The protection should consider more than one abuse dimension where appropriate, such as:

- phone number;
- IP/device;
- account/session;
- endpoint.

The implementation must avoid creating an easy denial-of-service vector against legitimate customers through overly aggressive public lockouts.

---

## 25. Audit and Security Logging

Security-relevant authentication events should be observable.

Examples:

- OTP requested;
- OTP verification success/failure;
- session created;
- session revoked;
- MFA enrollment;
- MFA verification failure;
- account suspension affecting authentication;
- suspicious repeated authentication failures.

Logs must not contain:

- plaintext OTPs;
- passwords;
- access tokens;
- refresh tokens;
- MFA secrets;
- unnecessary sensitive personal data.

Authentication logs must use request/correlation identifiers where available.

---

## 26. Account Enumeration Protection

Public authentication endpoints must avoid exposing unnecessary account-existence information.

For example, OTP request responses should use a generic successful response even when the backend chooses not to reveal whether an identity already exists.

Any difference in response behavior must not make account discovery trivial through:

- response text;
- HTTP status;
- timing;
- distinct error structures.

Where business requirements require different behavior, it must be explicitly approved and documented.

---

## 27. Authentication and State Machines

Authentication state does not replace domain state machines.

Examples:

- an authenticated pharmacy owner cannot open a pharmacy that is not authorized to operate;
- an authenticated driver cannot accept a delivery while suspended;
- an authenticated driver cannot bypass `BUSY` state;
- an authenticated pharmacist cannot read an unassigned private consultation;
- an authenticated customer cannot modify another customer's order;
- an authenticated admin cannot bypass consultation privacy.

Domain state and authorization must be checked together.

---

## 28. API Protection

The API must define which endpoints are:

- public;
- customer-authenticated;
- internal-authenticated;
- admin-authenticated.

Public endpoints must be intentionally limited.

Protected endpoints must use authentication guards/middleware before resource-level authorization.

No controller should trust identity, role, pharmacy ID, or ownership fields supplied solely in the request body.

The authenticated principal should be injected/resolved by the backend security layer.

---

## 29. Development and Test Environment

Development/test authentication must remain structurally similar to production.

Test shortcuts may exist only when:

- isolated from production configuration;
- clearly identifiable;
- never enabled by default in production;
- unable to bypass production authentication accidentally.

Fake users or fake pharmacies must not be inserted into production data.

Automated tests should use controlled fixtures/factories rather than manually polluting the development database.

---

## 30. Required Security Tests

Before Identity is considered complete, test at least:

### Customer OTP

- valid OTP;
- invalid OTP;
- expired OTP;
- reused OTP;
- old OTP after a newer OTP was issued;
- excessive OTP attempts;
- excessive OTP requests;
- phone normalization;
- concurrent OTP verification.

### Sessions

- authenticated request;
- missing credentials;
- expired credentials;
- revoked credentials;
- logout;
- refresh/rotation if applicable;
- token replay protection where applicable.

### Roles

- customer cannot use internal endpoints;
- pharmacist cannot use admin endpoints;
- driver cannot use pharmacy-owner endpoints;
- owner cannot use admin-only endpoints;
- admin cannot access consultation chat through normal admin permissions.

### Pharmacy Membership

- active owner access;
- active pharmacist access;
- inactive membership denied;
- wrong-pharmacy access denied;
- removed membership denied.

### Driver

- pending driver denied from active delivery workflow;
- suspended driver denied;
- approved offline driver cannot accept as available;
- busy driver cannot accept another delivery.

### Security

- brute-force protection;
- account-enumeration resistance;
- secrets absent from logs;
- HTTPS enforcement in production configuration;
- secure credential storage expectations.

---

## 31. Implementation Sequence

The recommended Identity implementation order is:

1. Define authentication/session interfaces.
2. Implement phone normalization.
3. Implement customer OTP request/verification.
4. Implement customer session/token creation.
5. Implement internal authentication.
6. Implement authentication guards.
7. Implement role resolution.
8. Implement pharmacy-membership authorization.
9. Implement driver approval/authorization.
10. Implement admin MFA.
11. Implement session revocation/logout.
12. Add rate limiting and abuse protection.
13. Add security logging/audit events.
14. Add authorization and security tests.
15. Review all protected endpoints against the Permission Matrix.

No domain module should implement its own independent authentication logic.

---

## 32. Change Policy

Any change to:

- authentication method;
- OTP behavior;
- session/token model;
- internal identity provider;
- MFA requirements;
- role authority;
- pharmacy membership authorization;
- driver authentication/approval boundary;
- consultation privacy boundary;
- rate-limit/security policy

must be reviewed against the SRS, Decision Log, Permission Matrix, OpenAPI contract, and affected tests.

Security-sensitive changes require explicit review before production deployment.

---

## 33. Final Principle

> Identity is authenticated centrally, authorization is enforced by the backend at resource and action level, domain state remains authoritative, and no client-controlled role or permission can bypass the security boundary.
