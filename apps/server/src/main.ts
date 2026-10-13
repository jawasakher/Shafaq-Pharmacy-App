import 'dotenv/config';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module.js';

async function bootstrap() {
  console.log('BOOTSTRAP: Starting Shafaq API server on Railway...');

  const app = await NestFactory.create(AppModule);

  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const rawPort = process.env.PORT;
  const port = rawPort ? parseInt(rawPort, 10) : 3000;

  await app.listen(port, '0.0.0.0');
  console.log(`BOOTSTRAP: Shafaq API successfully listening on port ${port} (0.0.0.0)`);
}

bootstrap().catch((err) => {
  console.error('FATAL BOOTSTRAP ERROR:', err);
  process.exit(1);
});
