import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateConsultationDto } from './dto/create-consultation.dto.js';

@Injectable()
export class ConsultationService {
  constructor(private readonly prisma: PrismaService) {}

  async createConsultation(customerId: string, dto: CreateConsultationDto) {
    return this.prisma.consultation.create({
      data: {
        customerId,
        symptoms: dto.symptoms,
        duration: dto.duration,
        age: dto.age,
        currentMedications: dto.currentMedications,
        allergies: dto.allergies,
        additionalDetails: dto.additionalDetails,
        pharmacyId: dto.pharmacyId,
        status: 'REQUESTED',
      },
    });
  }

  async listCustomerConsultations(customerId: string) {
    return this.prisma.consultation.findMany({
      where: { customerId },
      include: {
        pharmacist: { select: { id: true, name: true, phone: true } },
        pharmacy: { select: { id: true, name: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listPendingConsultationsForPharmacist(pharmacistUserId: string) {
    const membership = await this.prisma.pharmacyMember.findFirst({
      where: { userId: pharmacistUserId, status: 'ACTIVE' },
    });

    if (!membership) {
      throw new ForbiddenException('User is not an active pharmacy member');
    }

    return this.prisma.consultation.findMany({
      where: {
        OR: [
          { status: 'REQUESTED', pharmacyId: membership.pharmacyId },
          { status: 'REQUESTED', pharmacyId: null },
          { pharmacistId: pharmacistUserId, status: 'IN_PROGRESS' },
        ],
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async assignConsultation(pharmacistUserId: string, consultationId: string) {
    const membership = await this.prisma.pharmacyMember.findFirst({
      where: { userId: pharmacistUserId, status: 'ACTIVE' },
    });

    if (!membership) {
      throw new ForbiddenException('User is not an active pharmacy member');
    }

    const consultation = await this.prisma.consultation.findUnique({
      where: { id: consultationId },
    });

    if (!consultation) {
      throw new NotFoundException('Consultation request not found');
    }

    if (consultation.status !== 'REQUESTED') {
      throw new BadRequestException('Consultation is already in progress or closed');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.consultation.update({
        where: { id: consultation.id },
        data: {
          pharmacistId: pharmacistUserId,
          pharmacyId: membership.pharmacyId,
          status: 'IN_PROGRESS',
        },
      });

      await tx.consultationAssignmentHistory.create({
        data: {
          consultationId: consultation.id,
          pharmacistId: pharmacistUserId,
          assignedByUserId: pharmacistUserId,
        },
      });

      return updated;
    });
  }

  async listMessages(userId: string, consultationId: string) {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id: consultationId },
    });

    if (!consultation) {
      throw new NotFoundException('Consultation not found');
    }

    if (consultation.customerId !== userId && consultation.pharmacistId !== userId) {
      throw new ForbiddenException('User does not have access to this consultation');
    }

    return this.prisma.chatMessage.findMany({
      where: { consultationId },
      include: {
        sender: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async sendMessage(senderUserId: string, consultationId: string, content: string) {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id: consultationId },
    });

    if (!consultation) {
      throw new NotFoundException('Consultation not found');
    }

    if (consultation.customerId !== senderUserId && consultation.pharmacistId !== senderUserId) {
      throw new ForbiddenException('User is not a participant in this consultation');
    }

    return this.prisma.chatMessage.create({
      data: {
        consultationId,
        senderId: senderUserId,
        content,
      },
      include: {
        sender: { select: { id: true, name: true, role: true } },
      },
    });
  }
}
