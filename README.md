# Shafaq

Shafaq is a pharmacy delivery and pharmacist consultation platform. This repository contains the React Native mobile app and the NestJS backend in one monorepo.

## Repository structure

```text
apps/
|-- mobile/   # Expo / React Native application
`-- server/   # NestJS API, Prisma schema, and migrations
```

## Requirements

- Node.js and npm
- PostgreSQL for the server
- Android Studio, Xcode, or Expo Go when running the mobile app on a device or simulator

## Install dependencies

Install dependencies in each application:

```bash
npm install --prefix apps/server
npm install --prefix apps/mobile
```

## Run from the repository root

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

## Development checks

Before committing changes, run the checks for the area you changed. For mobile work, run both lint and TypeScript typechecking from `apps/mobile`:

```bash
npm run mobile:lint
cd apps/mobile
npx tsc --noEmit
```

For backend work, run the server lint, build, and relevant tests from the repository root.
