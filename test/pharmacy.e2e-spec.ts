import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';
import { AuthSessionService } from '../src/identity/auth-session.service.js';
import { OTP_DELIVERY } from '../src/identity/otp-delivery.port.js';
import { TestOtpDeliveryService } from '../src/identity/test-otp-delivery.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Pharmacy API (e2e)', () => {
    let app: INestApplication<App>;
    let prisma: PrismaService;
    let otpDelivery: TestOtpDeliveryService;

    let phoneSequence = 0;

    const createdUserIds = new Set<string>();
    const createdPharmacyIds = new Set<string>();

    const nextTestPhone = () =>
        `+963991${Date.now().toString().slice(-6)}${++phoneSequence}`;

    beforeEach(async () => {
        const moduleFixture: TestingModule =
            await Test.createTestingModule({
                imports: [AppModule],
            })
                .overrideProvider(OTP_DELIVERY)
                .useClass(TestOtpDeliveryService)
                .compile();

        app = moduleFixture.createNestApplication();

        await app.init();

        prisma = app.get(PrismaService);

        otpDelivery =
            app.get<TestOtpDeliveryService>(OTP_DELIVERY);
    });

    afterEach(async () => {
        try {
            if (createdPharmacyIds.size > 0) {
                await prisma.pharmacy.deleteMany({
                    where: {
                        id: {
                            in: [...createdPharmacyIds],
                        },
                    },
                });
            }

            await prisma.pharmacy.deleteMany({
                where: {
                    name: {
                        startsWith: 'E2E Pharmacy ',
                    },
                },
            });

            if (createdUserIds.size > 0) {
                await prisma.user.deleteMany({
                    where: {
                        id: {
                            in: [...createdUserIds],
                        },
                    },
                });
            }
        } finally {
            createdPharmacyIds.clear();
            createdUserIds.clear();

            await app.close();
        }
    });

    async function authenticateCustomer(
        phone = nextTestPhone(),
    ) {
        await request(app.getHttpServer())
            .post('/api/v1/auth/otp/request')
            .set(
                'x-device-id',
                `e2e-pharmacy-${phone}`,
            )
            .send({ phone })
            .expect(201);

        const code = otpDelivery.getCode(phone);

        expect(code).toMatch(/^\d{6}$/);

        const response = await request(app.getHttpServer())
            .post('/api/v1/auth/otp/verify')
            .send({
                phone,
                code,
            })
            .expect(201);

        const userId =
            response.body.data.user.id as string;

        createdUserIds.add(userId);

        return {
            phone,
            userId,
            token:
                response.body.data.session
                    .token as string,
        };
    }

    async function createUser(
        role:
            | 'CUSTOMER'
            | 'OWNER'
            | 'PHARMACIST'
            | 'ADMIN',
    ) {
        const user = await prisma.user.create({
            data: {
                phone: nextTestPhone(),
                role,
            },
        });

        createdUserIds.add(user.id);

        return user;
    }

    async function createInternalToken(
        userId: string,
    ) {
        const sessions =
            app.get(AuthSessionService);

        const session =
            await sessions.createInternalSession(
                userId,
            );

        return session.token;
    }

    async function createPendingPharmacy(
        userId: string,
    ) {
        const pharmacy =
            await prisma.pharmacy.create({
                data: {
                    name: `E2E Pharmacy Pending ${Date.now()}-${Math.random()}`,
                    phone: '+963991234567',
                    address: 'Latakia Test Address',
                    latitude: 35.5141,
                    longitude: 35.7767,
                    approvalStatus:
                        'PENDING_APPROVAL',
                    operationalStatus: 'CLOSED',
                    members: {
                        create: {
                            userId,
                            role: 'OWNER',
                            status: 'ACTIVE',
                        },
                    },
                },
            });

        createdPharmacyIds.add(
            pharmacy.id,
        );

        return pharmacy;
    }

    // ============================================================
    // PUBLIC DISCOVERY
    // ============================================================

    it('returns only pharmacies that are approved and open', async () => {
        const testNames = [
            `E2E Pharmacy Approved Open ${Date.now()}`,
            `E2E Pharmacy Approved Closed ${Date.now()}`,
            `E2E Pharmacy Pending Closed ${Date.now()}`,
            `E2E Pharmacy Rejected Closed ${Date.now()}`,
            `E2E Pharmacy Suspended Closed ${Date.now()}`,
        ];

        const pharmacies =
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
                        approvalStatus:
                            'PENDING_APPROVAL',
                        operationalStatus: 'CLOSED',
                    },
                    {
                        name: testNames[3],
                        latitude: '34.7303',
                        longitude: '36.7103',
                        approvalStatus: 'REJECTED',
                        operationalStatus: 'CLOSED',
                    },
                    {
                        name: testNames[4],
                        latitude: '34.7304',
                        longitude: '36.7104',
                        approvalStatus: 'SUSPENDED',
                        operationalStatus: 'CLOSED',
                    },
                ],
            });

        expect(pharmacies.count).toBe(5);

        const created =
            await prisma.pharmacy.findMany({
                where: {
                    name: {
                        in: testNames,
                    },
                },
                select: {
                    id: true,
                },
            });

        for (const pharmacy of created) {
            createdPharmacyIds.add(
                pharmacy.id,
            );
        }

        const response = await request(
            app.getHttpServer(),
        )
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

    // ============================================================
    // PHARMACY APPLICATION
    // ============================================================

    it('requires authentication to submit a pharmacy application', async () => {
        await request(app.getHttpServer())
            .post(
                '/api/v1/pharmacies/applications',
            )
            .send({
                name: 'E2E Pharmacy Unauthorized',
                address: 'Latakia',
                latitude: 35.5,
                longitude: 35.78,
            })
            .expect(401);
    });

    it('creates a pending closed pharmacy and an active OWNER membership atomically', async () => {
        const {
            token,
            userId,
        } = await authenticateCustomer();

        const response = await request(
            app.getHttpServer(),
        )
            .post(
                '/api/v1/pharmacies/applications',
            )
            .set(
                'Authorization',
                `Bearer ${token}`,
            )
            .send({
                name: 'E2E Pharmacy Registration',
                phone: '+963911234567',
                address: 'Latakia',
                latitude: 35.514,
                longitude: 35.78,
            })
            .expect(201);

        expect(response.body.success).toBe(
            true,
        );

        expect(
            response.body.data.approvalStatus,
        ).toBe('PENDING_APPROVAL');

        expect(
            response.body.data.operationalStatus,
        ).toBe('CLOSED');

        expect(
            response.body.data.members,
        ).toEqual([
            {
                role: 'OWNER',
                status: 'ACTIVE',
            },
        ]);

        const pharmacyId =
            response.body.data.id as string;

        createdPharmacyIds.add(
            pharmacyId,
        );

        const pharmacy =
            await prisma.pharmacy.findUnique({
                where: {
                    id: pharmacyId,
                },
                include: {
                    members: {
                        where: {
                            userId,
                        },
                    },
                },
            });

        expect(pharmacy).not.toBeNull();

        expect(
            pharmacy?.approvalStatus,
        ).toBe('PENDING_APPROVAL');

        expect(
            pharmacy?.operationalStatus,
        ).toBe('CLOSED');

        expect(
            pharmacy?.members,
        ).toHaveLength(1);

        expect(
            pharmacy?.members[0].role,
        ).toBe('OWNER');

        expect(
            pharmacy?.members[0].status,
        ).toBe('ACTIVE');

        const user =
            await prisma.user.findUnique({
                where: {
                    id: userId,
                },
                select: {
                    role: true,
                },
            });

        expect(user?.role).toBe('OWNER');
    });

    // ============================================================
    // ADMIN AUTHORIZATION
    // ============================================================

    it('rejects unauthenticated admin application access', async () => {
        await request(app.getHttpServer())
            .get(
                '/api/v1/pharmacies/admin/applications',
            )
            .expect(401);
    });

    it('rejects customer sessions from admin application access', async () => {
        const {
            token,
        } = await authenticateCustomer();

        await request(app.getHttpServer())
            .get(
                '/api/v1/pharmacies/admin/applications',
            )
            .set(
                'Authorization',
                `Bearer ${token}`,
            )
            .expect(401);
    });

    it('rejects non-admin internal users from admin application access', async () => {
        const user =
            await createUser('OWNER');

        const token =
            await createInternalToken(
                user.id,
            );

        await request(app.getHttpServer())
            .get(
                '/api/v1/pharmacies/admin/applications',
            )
            .set(
                'Authorization',
                `Bearer ${token}`,
            )
            .expect(403);
    });

    // ============================================================
    // ADMIN — LIST APPLICATIONS
    // ============================================================

    it('allows an admin to list pending pharmacy applications', async () => {
        const admin =
            await createUser('ADMIN');

        const owner =
            await createUser('OWNER');

        const pharmacy =
            await createPendingPharmacy(
                owner.id,
            );

        const token =
            await createInternalToken(
                admin.id,
            );

        const response = await request(
            app.getHttpServer(),
        )
            .get(
                '/api/v1/pharmacies/admin/applications',
            )
            .set(
                'Authorization',
                `Bearer ${token}`,
            )
            .expect(200);

        expect(
            response.body.success,
        ).toBe(true);

        expect(
            response.body.data,
        ).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: pharmacy.id,
                    approvalStatus:
                        'PENDING_APPROVAL',
                    operationalStatus:
                        'CLOSED',
                }),
            ]),
        );
    });

    // ============================================================
    // ADMIN — APPROVE
    // ============================================================

    it('allows an admin to approve a pending pharmacy', async () => {
        const admin =
            await createUser('ADMIN');

        const owner =
            await createUser('OWNER');

        const pharmacy =
            await createPendingPharmacy(
                owner.id,
            );

        const token =
            await createInternalToken(
                admin.id,
            );

        const response = await request(
            app.getHttpServer(),
        )
            .post(
                `/api/v1/pharmacies/admin/${pharmacy.id}/approve`,
)
.set(
    'Authorization',
    `Bearer ${token}`,
)
    .expect(201);

expect(
    response.body.success,
).toBe(true);

expect(
    response.body.data,
).toMatchObject({
  id: pharmacy.id,
  approvalStatus:
      'APPROVED',
  operationalStatus:
      'CLOSED',
});

const updated =
    await prisma.pharmacy.findUnique({
      where: {
        id: pharmacy.id,
      },
    });

expect(
    updated?.approvalStatus,
).toBe('APPROVED');

expect(
    updated?.operationalStatus,
).toBe('CLOSED');
});

it('does not allow approving an already approved pharmacy', async () => {
  const admin =
      await createUser('ADMIN');

  const pharmacy =
      await prisma.pharmacy.create({
        data: {
          name: `E2E Pharmacy Already Approved ${Date.now()}`,
          address: 'Test Address',
          latitude: 35.5141,
          longitude: 35.7767,
          approvalStatus:
              'APPROVED',
          operationalStatus:
              'CLOSED',
        },
      });

  createdPharmacyIds.add(
      pharmacy.id,
  );

  const token =
      await createInternalToken(
          admin.id,
      );

  const response = await request(
      app.getHttpServer(),
  )
      .post(
          `/api/v1/pharmacies/admin/${pharmacy.id}/approve`,
      )
      .set(
          'Authorization',
          `Bearer ${token}`,
      )
      .expect(400);

  expect(
      response.body.message,
  ).toContain(
      'Invalid pharmacy approval transition',
  );
});

// ============================================================
// ADMIN — REJECT
// ============================================================

it('allows an admin to reject a pending pharmacy', async () => {
  const admin =
      await createUser('ADMIN');

  const owner =
      await createUser('OWNER');

  const pharmacy =
      await createPendingPharmacy(
          owner.id,
      );

  const token =
      await createInternalToken(
          admin.id,
      );

  const response = await request(
      app.getHttpServer(),
  )
      .post(
          `/api/v1/pharmacies/admin/${pharmacy.id}/reject`,
      )
      .set(
          'Authorization',
          `Bearer ${token}`,
      )
      .expect(201);

  expect(
      response.body.success,
  ).toBe(true);

  expect(
      response.body.data,
  ).toMatchObject({
    id: pharmacy.id,
    approvalStatus:
        'REJECTED',
    operationalStatus:
        'CLOSED',
  });
});

it('does not allow rejecting an already approved pharmacy', async () => {
  const admin =
      await createUser('ADMIN');

  const pharmacy =
      await prisma.pharmacy.create({
        data: {
          name: `E2E Pharmacy Approved Reject ${Date.now()}`,
          address: 'Test Address',
          latitude: 35.5141,
          longitude: 35.7767,
          approvalStatus:
              'APPROVED',
          operationalStatus:
              'CLOSED',
        },
      });

  createdPharmacyIds.add(
      pharmacy.id,
  );

  const token =
      await createInternalToken(
          admin.id,
      );

  await request(app.getHttpServer())
      .post(
          `/api/v1/pharmacies/admin/${pharmacy.id}/reject`,
      )
      .set(
          'Authorization',
          `Bearer ${token}`,
      )
      .expect(400);
});

// ============================================================
// ADMIN — SUSPEND
// ============================================================

it('allows an admin to suspend an approved pharmacy and forces it closed', async () => {
  const admin =
      await createUser('ADMIN');

  const pharmacy =
      await prisma.pharmacy.create({
        data: {
          name: `E2E Pharmacy To Suspend ${Date.now()}`,
          address: 'Test Address',
          latitude: 35.5141,
          longitude: 35.7767,
          approvalStatus:
              'APPROVED',
          operationalStatus:
              'OPEN',
        },
      });

  createdPharmacyIds.add(
      pharmacy.id,
  );

  const token =
      await createInternalToken(
          admin.id,
      );

  const response = await request(
      app.getHttpServer(),
  )
      .post(
          `/api/v1/pharmacies/admin/${pharmacy.id}/suspend`,
      )
      .set(
          'Authorization',
          `Bearer ${token}`,
      )
      .expect(201);

  expect(
      response.body.success,
  ).toBe(true);

  expect(
      response.body.data,
  ).toMatchObject({
    id: pharmacy.id,
    approvalStatus:
        'SUSPENDED',
    operationalStatus:
        'CLOSED',
  });

  const updated =
      await prisma.pharmacy.findUnique({
        where: {
          id: pharmacy.id,
        },
      });

  expect(
      updated?.approvalStatus,
  ).toBe('SUSPENDED');

  expect(
      updated?.operationalStatus,
  ).toBe('CLOSED');
});

// ============================================================
// ADMIN — NOT FOUND
// ============================================================

it('returns 404 when an admin tries to change a nonexistent pharmacy', async () => {
  const admin =
      await createUser('ADMIN');

  const token =
      await createInternalToken(
          admin.id,
      );

  await request(app.getHttpServer())
      .post(
          '/api/v1/pharmacies/admin/00000000-0000-0000-0000-000000000000/approve',
      )
      .set(
          'Authorization',
          `Bearer ${token}`,
      )
      .expect(404);
});
});
