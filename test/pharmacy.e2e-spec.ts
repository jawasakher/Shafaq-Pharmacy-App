import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';

import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Pharmacy discovery (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const testRun = Date.now();
  const testNames = [
    `E2E Approved Open ${testRun}`,
    `E2E Approved Closed ${testRun}`,
    `E2E Pending Open ${testRun}`,
    `E2E Rejected Open ${testRun}`,
    `E2E Suspended Open ${testRun}`,
  ];

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterEach(async () => {
    await prisma.pharmacy.deleteMany({
      where: {
        name: {
          in: testNames,
        },
      },
    });
    await app.close();
  });

  it('returns only pharmacies that are approved and open', async () => {
    await prisma.pharmacy.createMany({
      data: [
        {
          name: testNames[0],
          latitude: '34.7300',
          longitude: '36.7100',
          approvalStatus: 'APPROVED',
          operationalStatus: 'OPEN',
        },
        {
          name: testNames[1],
          latitude: '34.7301',
          longitude: '36.7101',
          approvalStatus: 'APPROVED',
          operationalStatus: 'CLOSED',
        },
        {
          name: testNames[2],
          latitude: '34.7302',
          longitude: '36.7102',
          approvalStatus: 'PENDING_APPROVAL',
          operationalStatus: 'OPEN',
        },
        {
          name: testNames[3],
          latitude: '34.7303',
          longitude: '36.7103',
          approvalStatus: 'REJECTED',
          operationalStatus: 'OPEN',
        },
        {
          name: testNames[4],
          latitude: '34.7304',
          longitude: '36.7104',
          approvalStatus: 'SUSPENDED',
          operationalStatus: 'OPEN',
        },
      ],
    });

    const response = await request(app.getHttpServer())
      .get('/api/v1/pharmacies')
      .expect(200);

    expect(response.body).toEqual([
      expect.objectContaining({
        name: testNames[0],
        approvalStatus: 'APPROVED',
        operationalStatus: 'OPEN',
      }),
    ]);
  });
});
