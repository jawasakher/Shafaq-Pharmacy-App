# 📱 شَفَق (Shafaq) — Android App Direct Download

[![Download Shafaq APK](https://img.shields.io/badge/Download-Shafaq%20Android%20APK-19A9CC?style=for-the-badge&logo=android&logoColor=white)](https://github.com/JAWA/shafaq-monorepo/releases/latest)

> **تحميل تطبيق شَفَق للرعاية الطبية والصيدلانية المباشر للأندرويد**  
> يمكنك تنزيل ملف الـ APK وتثبيته مباشرة على جهازك دون الحاجة لمتجر تطبيقات.

### 📥 روابط التنزيل المباشر (Direct Download Links):
- **رابط التحميل المباشر للـ APK:** [تحميل تطبيق شَفَق (shafaq.apk)](https://github.com/JAWA/shafaq-monorepo/releases/latest/download/shafaq.apk)
- **صفحة جميع الإصدارات والتحديثات:** [GitHub Releases Page](https://github.com/JAWA/shafaq-monorepo/releases)

---

# Shafaq Monorepo

Shafaq (شَفَق) is an Arabic-first digital healthcare, pharmacy delivery, and medical consultation platform. This repository contains the React Native mobile app and the NestJS backend in one monorepo.

## Repository Structure

```text
apps/
|-- mobile/   # Expo / React Native application
`-- server/   # NestJS API, Prisma schema, and migrations
```

## Requirements

- Node.js and npm
- PostgreSQL for the server
- Android Studio, Xcode, or Expo Go when running the mobile app on a device or simulator

## Install Dependencies

Install dependencies in each application:

```bash
npm install --prefix apps/server
npm install --prefix apps/mobile
```

## Run from the Repository Root

Start the backend in watch mode:

```bash
npm run server:dev
```

Start the mobile development server:

```bash
npm run mobile:start
```

Other useful commands:

```bash
npm run server:build
npm run server:test
npm run server:test:e2e
npm run server:lint
npm run mobile:android
npm run mobile:ios
npm run mobile:web
npm run mobile:lint
```

## Prisma

The server owns the Prisma schema and database migrations. Generate the Prisma client or apply deployed migrations with:

```bash
npm run server:prisma:generate
npm run server:prisma:migrate
```

Configure the server environment using `apps/server/.env` (see the server documentation for the required database and authentication settings). Do not commit secrets; `.env.example` files are allowed by the repository `.gitignore`.

## Development Checks

Before committing changes, run the checks for the area you changed. For mobile work, run both lint and TypeScript typechecking from `apps/mobile`:

```bash
npm run mobile:lint
cd apps/mobile
npx tsc --noEmit
```

For backend work, run the server lint, build, and relevant tests from the repository root.
