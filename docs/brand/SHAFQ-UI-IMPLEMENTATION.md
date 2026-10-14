# SHAFQ — UI Implementation & Component Architecture

## Architecture
- **Framework**: React Native & Expo Router (`apps/mobile/src/app/`)
- **Design System Components**: Located in `apps/mobile/src/components/ui/`
  - `BrandLogo` / `BrandEmblem`
  - `PrimaryButton` / `SecondaryButton`
  - `ShafaqCard`
  - `ScreenHeader`
  - State handlers (`LoadingState`, `ErrorState`, `EmptyState`)

## Role-Based Interfaces
1. **Customer Interface (`apps/mobile/src/app/(tabs)/`, etc.)**: Discovery, prescriptions, orders, consultations, profile.
2. **Pharmacist Interface (`apps/mobile/src/app/(pharmacist)/`)**: Order queues, prescription review, pharmacy operations.
3. **Delivery Interface (`apps/mobile/src/app/(delivery)/`)**: Assigned delivery tasks, navigation, delivery status updates.
