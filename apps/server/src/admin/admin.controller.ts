import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';

import { InternalIdentityGuard } from '../identity/internal-identity.guard.js';
import { Roles } from '../identity/roles.decorator.js';
import { RolesGuard } from '../identity/roles.guard.js';
import { AdminService } from './admin.service.js';

@Controller('api/v1/admin')
@UseGuards(InternalIdentityGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard/metrics')
  async getDashboardMetrics() {
    return {
      success: true,
      data: await this.adminService.getDashboardMetrics(),
    };
  }

  @Get('audit-logs')
  async getAuditLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 20;

    return {
      success: true,
      data: await this.adminService.getAuditLogs(p, l),
    };
  }

  @Get('transfers')
  async getTransfers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 20;

    return {
      success: true,
      data: await this.adminService.getTransfers(p, l),
    };
  }

  @Get('deliveries')
  async getDeliveries(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 20;

    return {
      success: true,
      data: await this.adminService.getDeliveries(p, l),
    };
  }

  @Get('consultations')
  async getConsultations(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 20;

    return {
      success: true,
      data: await this.adminService.getConsultations(p, l),
    };
  }
}
