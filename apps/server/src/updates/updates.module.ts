import { Module } from '@nestjs/common';

import { IdentityModule } from '../identity/identity.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { UpdatesController } from './updates.controller.js';
import { UpdatesService } from './updates.service.js';

@Module({
  imports: [PrismaModule, IdentityModule],
  controllers: [UpdatesController],
  providers: [UpdatesService],
  exports: [UpdatesService],
})
export class UpdatesModule {}
