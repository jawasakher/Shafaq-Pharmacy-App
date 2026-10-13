import 'dotenv/config';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module.js';

async function bootstrap() {
  const rawPort = process.env.PORT;
  const port = rawPort ? parseInt(rawPort, 10) : 3000;

  console.log(`BOOTSTRAP: Initializing Shafaq API server on port ${port}...`);

  const app = await NestFactory.create(AppModule);

  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(port, '0.0.0.0');
  console.log(`BOOTSTRAP: Shafaq API is successfully listening on http://0.0.0.0:${port}`);
}

bootstrap().catch((err) => {
  console.error('FATAL BOOTSTRAP ERROR:', err);
  process.exit(1);
});
