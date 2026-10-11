import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { CustomerIdentityGuard } from '../identity/customer-identity.guard.js';
import { IdentityGuard } from '../identity/identity.guard.js';
import { InternalIdentityGuard } from '../identity/internal-identity.guard.js';
import { Roles } from '../identity/roles.decorator.js';
import { RolesGuard } from '../identity/roles.guard.js';
import { ConsultationService } from './consultation.service.js';
import { CreateConsultationDto } from './dto/create-consultation.dto.js';
import { SendMessageDto } from './dto/send-message.dto.js';

type AuthenticatedRequest = Request & {
  user: {
    id: string;
    role: string;
  };
};

@Controller('api/v1')
export class ConsultationController {
  constructor(private readonly consultationService: ConsultationService) {}

  @Post('consultations')
  @UseGuards(CustomerIdentityGuard, RolesGuard)
  @Roles('CUSTOMER')
  async createConsultation(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateConsultationDto,
  ) {
    return {
      success: true,
      data: await this.consultationService.createConsultation(
        request.user.id,
        dto,
      ),
    };
  }

  @Get('consultations')
  @UseGuards(CustomerIdentityGuard, RolesGuard)
  @Roles('CUSTOMER')
  async listCustomerConsultations(@Req() request: AuthenticatedRequest) {
    return {
      success: true,
      data: await this.consultationService.listCustomerConsultations(
        request.user.id,
      ),
    };
  }

  @Get('pharmacy/consultations')
  @UseGuards(InternalIdentityGuard, RolesGuard)
  @Roles('OWNER', 'PHARMACIST')
  async listPendingConsultations(@Req() request: AuthenticatedRequest) {
    return {
      success: true,
      data: await this.consultationService.listPendingConsultationsForPharmacist(
        request.user.id,
      ),
    };
  }

  @Post('consultations/:id/assign')
  @HttpCode(HttpStatus.OK)
  @UseGuards(InternalIdentityGuard, RolesGuard)
  @Roles('OWNER', 'PHARMACIST')
  async assignConsultation(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return {
      success: true,
      data: await this.consultationService.assignConsultation(
        request.user.id,
        id,
      ),
    };
  }

  @Get('consultations/:id/messages')
  @UseGuards(IdentityGuard)
  async listMessages(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return {
      success: true,
      data: await this.consultationService.listMessages(
        request.user.id,
        id,
      ),
    };
  }

  @Post('consultations/:id/messages')
  @HttpCode(HttpStatus.OK)
  @UseGuards(IdentityGuard)
  async sendMessage(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    return {
      success: true,
      data: await this.consultationService.sendMessage(
        request.user.id,
        id,
        dto.content,
      ),
    };
  }
}
