# SHAFaq — Super Admin Control Center Audit & Evidence Report

**Document Version:** 3.0 (Strict Read-Only Audit Correction)  
**Date:** October 10, 2026  
**Repository Root:** `C:/Users/JAWA/WebstormProjects/untitled/shafaq-monorepo`  
**Git Branch:** `migration/server-into-app`  
**Authoritative Baseline:** Current Codebase Inspection & Verified Tests  

---

## 1. Source Evidence & Code Audits

### 1.1 Authentication & Session Type Enforcement

* **File:** `apps/server/src/identity/auth-session.service.ts` (lines 43–61)
* **Code Snippet:**
  ```typescript
  async authenticate(token: string, expectedType?: 'CUSTOMER' | 'INTERNAL' | 'PRE_MFA') {
    const tokenHash = this.hash(token);
    const session = await this.prisma.authSession.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (
      !session ||
      (expectedType && session.type !== expectedType) ||
      (!expectedType && session.type === 'PRE_MFA') ||
      session.revokedAt ||
      session.expiresAt <= new Date()
    ) {
      throw new UnauthorizedException('Invalid or expired session');
    }
    return session.user;
  }
  ```
* **What Evidence Proves:**
  - When `expectedType` is provided (e.g., `'INTERNAL'` or `'CUSTOMER'`), `session.type !== expectedType` throws `401 Unauthorized`.
  - When `expectedType` is omitted (e.g., in generic `IdentityGuard`), `(!expectedType && session.type === 'PRE_MFA')` throws `401 Unauthorized`.
* **What Evidence DOES NOT Prove:**
  - It does NOT prove that public routes (e.g., `GET /api/v1/pharmacies` or `POST /api/v1/auth/otp/request`) reject `PRE_MFA` tokens. Public routes do not invoke guards and ignore the `Authorization` header completely.

---

### 1.2 Guards & Authorization Hierarchy

1. **`InternalIdentityGuard`**:
   - **File:** `apps/server/src/identity/internal-identity.guard.ts` (lines 1–37)
   - **Snippet:** `request.user = await this.sessions.authenticate(token, 'INTERNAL');`
   - **Proves:** Strictly requires `session.type === 'INTERNAL'`. Rejects `CUSTOMER` and `PRE_MFA` sessions (`401 Unauthorized`).

2. **`CustomerIdentityGuard`**:
   - **File:** `apps/server/src/identity/customer-identity.guard.ts` (lines 1–50)
   - **Snippet:** `request.user = await this.authSessionService.authenticate(token, 'CUSTOMER');`
   - **Proves:** Strictly requires `session.type === 'CUSTOMER'`. Rejects `INTERNAL` and `PRE_MFA` sessions (`401 Unauthorized`).

3. **`MfaIdentityGuard`**:
   - **File:** `apps/server/src/identity/mfa-identity.guard.ts` (lines 1–35)
   - **Snippet:** `request.user = await this.sessions.authenticate(token, 'PRE_MFA');`
   - **Proves:** Accepts ONLY `PRE_MFA` sessions. Rejects fully authenticated `INTERNAL` or `CUSTOMER` sessions.

4. **`RolesGuard`**:
   - **File:** `apps/server/src/identity/roles.guard.ts` (lines 1–31)
   - **Snippet:**
     ```typescript
     if (!request.user?.role || !requiredRoles.includes(request.user.role)) {
       throw new ForbiddenException('Insufficient permissions');
     }
     ```
   - **Proves:** Verifies `request.user.role` matches the `@Roles(...)` metadata. Throws `403 Forbidden` if role mismatch occurs.

---

### 1.3 MFA Flow & Administrative Authentication Trace

* **Source File:** `apps/server/src/identity/identity.controller.ts` (lines 42–115, 117–195)
* **Flow Trace:**
  1. **OTP Verification (`POST /auth/otp/verify`)**:
     - User submits `{ phone, code, purpose: 'INTERNAL' }`.
     - If `user.role === 'ADMIN'`:
       - Issues a `PRE_MFA` session (10-minute lifetime). Returns `{ requiresMfa: true, setupRequired: !user.mfaEnabled || !user.mfaSecret }`.
  2. **MFA Setup (`POST /auth/mfa/setup`)**:
     - Protected by `@UseGuards(MfaIdentityGuard)`.
     - If `user.mfaEnabled` is `true`, throws `ForbiddenException('MFA is already enabled on this account')`.
     - Generates TOTP secret, encrypts with AES-256-GCM via `TotpService`, saves `mfaSecret` to DB.
  3. **MFA Enable (`POST /auth/mfa/enable`)**:
     - Protected by `@UseGuards(MfaIdentityGuard)`.
     - Verifies 6-digit TOTP code against decrypted `mfaSecret`.
     - Sets `mfaEnabled = true`, revokes `PRE_MFA` token, issues `INTERNAL` session.
  4. **MFA Verify (`POST /auth/mfa/verify`)**:
     - Protected by `@UseGuards(MfaIdentityGuard)`.
     - Verifies TOTP code via `totpService.verifyTotp(plainSecret, body.code)`.
     - Upon successful verification, revokes `PRE_MFA` token and issues full `INTERNAL` session token.

---

## 2. Financial, Revenue & Payment Review

### 2.1 Prisma Schema & Data Models
* **Source:** `apps/server/prisma/schema.prisma` (lines 105–120, 440–475, 579–595)
* **Payment Models:**
  - `Payment`: `status` (`PaymentStatus`), `amount` (Decimal), `provider` (`SHAM_CASH`), `idempotencyKey`, `paidAt`, `cancelledAt`.
  - `PaymentStatus` Enum: `NOT_REQUIRED`, `PENDING`, `PROCESSING`, `REQUIRES_ACTION`, `PAID`, `FAILED`, `EXPIRED`, `UNKNOWN`, `CANCELLED`, `REFUND_PENDING`, `REFUNDED`, `PARTIALLY_REFUNDED`.
  - `CashCollection`: `status` (`CashCollectionStatus`: `PENDING`, `COLLECTED`, `REMITTED`), `amount`.

### 2.2 Financial Revenue Definition & Decision Required
- **Audit Finding:** The project repository does **NOT** contain an explicit financial revenue calculation specification in `docs/` or source code.
- **Classification:** **`DECISION_REQUIRED`**
  - A formal decision from the project stakeholders is required to define:
    1. Whether revenue in the Admin Dashboard reports Gross Electronic Paid (`Payment.status === 'PAID'`) + COD Collected (`CashCollection.status === 'COLLECTED'`), OR Net Revenue subtracting `REFUNDED` / `PARTIALLY_REFUNDED`.
    2. How unconfirmed `UNKNOWN` payment transactions are displayed in system telemetry.

---

## 3. Real-Time Telemetry & Healthcare Privacy Analysis

### 3.1 Real-Time Infrastructure Check
* **Source Inspection:** Searched `apps/server/src` for `WebSocketGateway`, `ServerSentEvents`, or `SubscribeMessage`.
* **Finding:** No WebSocket or SSE infrastructure exists in `apps/server/src`.
* **Consequence:** All "real-time" dashboard widgets in mobile/web must use bounded periodic HTTP polling (`refreshControl` or interval timers).

### 3.2 Healthcare Privacy & Data Minimization
* **Prescription Privacy (`prescription.service.ts:380–415`)**:
  - `assertReadAccess` strictly verifies order customer ownership OR active pharmacy membership before returning signed URLs.
  - Super Admin endpoints **MUST NOT** expose prescription images (`storageKey`) or signed file download URLs in routine monitoring lists.
* **Consultation Privacy (`schema.prisma:695–710`)**:
  - `ChatMessage.content` contains private patient-pharmacist communication.
  - Super Admin monitoring endpoints (`/admin/consultations`) **MUST NOT** include `ChatMessage.content` in query responses. Only operational metadata (`id`, `status`, `symptoms` summary, `createdAt`, `pharmacistId`) is allowed.

---

## 4. System Capabilities Matrix

| Feature Domain | Feature Description | Implementation Evidence & Location | Executed Test Status | Compliance Status |
|---|---|---|---|---|
| **Identity** | OTP login with rate limiting & purpose binding | `identity.controller.ts:26-70`, `otp.service.ts:24-140` | Unit Tests Passed (4/4) | **CODE VERIFIED — E2E UNTESTED** |
| **Admin MFA** | Production Admin TOTP MFA enforcement & AES-256 encrypted secrets | `totp.service.ts:1-120`, `identity.controller.ts:117-195` | `totp.service.spec.ts` Passed (6/6) | **CODE VERIFIED — E2E UNTESTED** |
| **Session Isolation** | Strict separation of CUSTOMER, INTERNAL, and PRE_MFA sessions | `auth-session.service.ts:43-61` | Unit Logic Verified | **CODE VERIFIED — E2E UNTESTED** |
| **Orders & Transfers** | Single pharmacy fulfillment, 10km radius & 15m offer expiration | `orders.service.ts:910-980`, `transfer.config.ts` | E2E Suite Not Executed | **CODE VERIFIED — E2E UNTESTED** |
| **Prescriptions** | Private storage with 5m TTL HMAC-SHA256 signed URLs & read access checks | `prescription.service.ts:328-415`, `private-disk-storage.service.ts:54-118` | E2E Suite Not Executed | **CODE VERIFIED — E2E UNTESTED** |
| **Consultations** | Patient-pharmacist consultation queue & chat; message privacy | `consultation.service.ts:1-160`, `consultation.controller.ts` | E2E Suite Not Executed | **PARTIALLY VERIFIED** |
| **Deliveries** | Driver location tracking, offer acceptance, pickup/completion states | `delivery.service.ts:1-180`, `driver.controller.ts` | E2E Suite Not Executed | **PARTIALLY VERIFIED** |
| **Payments** | Sham Cash integration, status tracking, UNKNOWN handling | `schema.prisma:440-475` (`Payment`, `PaymentStatus`) | E2E Suite Not Executed | **DECISION_REQUIRED** |

---

## 5. Git Status Baseline & Working Tree State

* **Command Executed:** `git status --short`
* **Current Working Tree State:**
  ```text
  M apps/mobile/app.json
  AM apps/mobile/src/app/(pharmacist)/transfers.tsx
   M apps/mobile/src/app/(tabs)/account.tsx
   M apps/mobile/src/app/(tabs)/index.tsx
   M apps/mobile/src/app/_layout.tsx
   M apps/mobile/src/app/explore.tsx
   M apps/mobile/src/app/privacy-security.tsx
  A  apps/mobile/src/components/ui/error-state.tsx
   M apps/mobile/src/constants/theme.ts
   M apps/mobile/src/lib/auth.ts
   M apps/mobile/src/services/api-client.ts
   M apps/mobile/src/services/api.ts
   M apps/server/prisma/schema.prisma
   M apps/server/src/app.module.ts
   M apps/server/src/identity/auth-session.service.ts
   M apps/server/src/identity/identity.controller.ts
   M apps/server/src/identity/identity.module.ts
   M apps/server/src/identity/otp.service.ts
   M apps/server/test/identity.e2e-spec.ts
  ?? apps/mobile/src/app/(delivery)/
  ?? apps/mobile/src/app/(pharmacist)/_layout.tsx
  ?? apps/mobile/src/app/(pharmacist)/account.tsx
  ?? apps/mobile/src/app/(pharmacist)/consultations.tsx
  ?? apps/mobile/src/app/(pharmacist)/index.tsx
  ?? apps/mobile/src/app/auth/
  ?? apps/mobile/src/app/index.tsx
  ?? apps/mobile/src/components/ui/brand-logo.tsx
  ?? apps/mobile/src/components/ui/empty-state.tsx
  ?? apps/mobile/src/components/ui/loading-state.tsx
  ?? apps/mobile/src/components/ui/primary-button.tsx
  ?? apps/mobile/src/components/ui/screen-header.tsx
  ?? apps/mobile/src/components/ui/secondary-button.tsx
  ?? apps/mobile/src/components/ui/shafaq-card.tsx
  ?? apps/server/prisma/migrations/20261010190000_mfa_and_purpose/
  ?? apps/server/src/consultation/
  ?? apps/server/src/delivery/
  ?? apps/server/src/identity/auth-rate-limit.service.spec.ts
  ?? apps/server/src/identity/mfa-identity.guard.ts
  ?? apps/server/src/identity/phone-normalizer.service.spec.ts
  ?? apps/server/src/identity/totp.service.spec.ts
  ?? apps/server/src/identity/totp.service.ts
  ?? docs/
  ```

---

## 6. Verified Test Execution Log

### Executed Unit Tests (Isolated Mode, 0ms DB Dependency)

* **Command Executed:** `npx vitest run src/app.controller.spec.ts src/identity/totp.service.spec.ts src/identity/phone-normalizer.service.spec.ts src/identity/auth-rate-limit.service.spec.ts`
* **Directory:** `apps/server`
* **Exit Code:** `0` (PASS)
* **Execution Outcome:** **14 unit tests executed and passed (14/14 PASS)**.

```text
 ✓ src/identity/auth-rate-limit.service.spec.ts (4 tests)
 ✓ src/identity/phone-normalizer.service.spec.ts (3 tests)
 ✓ src/identity/totp.service.spec.ts (6 tests)
 ✓ src/app.controller.spec.ts (1 test)

Test Files  4 passed (4)
     Tests  14 passed (14)
  Duration  1.30s
```

* **E2E Test Execution Note:** The live End-to-End integration suite (`npm run test:e2e`) was **NOT executed** in this audit run to prevent unisolated network writes to the remote Neon PostgreSQL development database. Passing 14 unit tests verifies service-level logic but does NOT prove live E2E behavior or full database integration.

---

## 7. Open Decisions Required (`DECISION_REQUIRED`)

1. **Financial Revenue Formula**:
   - Is revenue calculated as Gross Electronic Paid (`Payment.status === 'PAID'`) + COD Collected (`CashCollection.status === 'COLLECTED'`), OR Net Revenue subtracting `REFUNDED` / `PARTIALLY_REFUNDED`?
2. **Super Admin Role Mutation Policy**:
   - Should Super Admin endpoints allow changing user roles via `PATCH /admin/users/:id/role` for all roles, or restrict promoting users to `ADMIN`?
3. **Audit Log Retention Window**:
   - What is the target retention period for `AuditLog` records before archiving?
