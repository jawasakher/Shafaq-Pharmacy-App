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

describe('Orders API (e2e)', () => {
    let app: INestApplication<App>;
    let prisma: PrismaService;
    let otpDelivery: TestOtpDeliveryService;

    let phoneSequence = 0;

    const createdUserIds = new Set<string>();
    const createdPharmacyIds = new Set<string>();
    const createdOrderIds = new Set<string>();

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
            if (createdOrderIds.size > 0) {
                await prisma.order.deleteMany({
                    where: {
                        id: {
                            in: [...createdOrderIds],
                        },
                    },
                });
            }

            if (createdPharmacyIds.size > 0) {
                await prisma.pharmacy.deleteMany({
                    where: {
                        id: {
                            in: [...createdPharmacyIds],
                        },
                    },
                });
            }

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
            createdOrderIds.clear();
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
                `e2e-orders-${phone}`,
            )
            .send({ phone })
            .expect(201);

        const code = otpDelivery.getCode(phone);

        expect(code).toMatch(/^\d{6}$/);

        const response = await request(
            app.getHttpServer(),
        )
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

    async function createPharmacy(
        approvalStatus:
            | 'PENDING_APPROVAL'
            | 'APPROVED'
            | 'REJECTED'
            | 'SUSPENDED',
        operationalStatus:
            | 'OPEN'
            | 'CLOSED',
    ) {
        const pharmacy =
            await prisma.pharmacy.create({
                data: {
                    name: `E2E Orders Pharmacy ${Date.now()}-${Math.random()}`,
                    phone: '+963991234567',
                    address: 'Orders Test Address',
                    latitude: 35.5141,
                    longitude: 35.7767,
                    approvalStatus,
                    operationalStatus,
                },
            });

        createdPharmacyIds.add(pharmacy.id);

        return pharmacy;
    }

    // ============================================================
    // ORDER CREATION
    // ============================================================

    it('creates a pending order with medicine items for an authenticated customer', async () => {
        const {
            token,
            userId,
        } = await authenticateCustomer();

        const pharmacy =
            await createPharmacy(
                'APPROVED',
                'OPEN',
            );

        const response = await request(
            app.getHttpServer(),
        )
            .post('/api/v1/orders')
            .set(
                'Authorization',
                `Bearer ${token}`,
            )
            .send({
                pharmacyId: pharmacy.id,
                deliveryAddress:
                    'Test Delivery Address',
                deliveryLatitude: '35.5200000',
                deliveryLongitude: '35.7800000',
                items: [
                    {
                        medicineName:
                            'Paracetamol',
                        quantity: 2,
                    },
                    {
                        medicineName:
                            'Vitamin C',
                        quantity: 1,
                    },
                ],
            })
            .expect(201);

        const orderId =
            response.body.id as string;

        createdOrderIds.add(orderId);

        expect(response.body).toMatchObject({
            id: orderId,
            status: 'PENDING',
            deliveryAddress:
                'Test Delivery Address',
            pharmacy: {
                id: pharmacy.id,
                approvalStatus: 'APPROVED',
                operationalStatus: 'OPEN',
            },
        });

        expect(response.body.items).toHaveLength(2);

        expect(response.body.items).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    medicineName:
                        'Paracetamol',
                    quantity: 2,
                    status: 'PENDING',
                }),
                expect.objectContaining({
                    medicineName:
                        'Vitamin C',
                    quantity: 1,
                    status: 'PENDING',
                }),
            ]),
        );

        const savedOrder =
            await prisma.order.findUnique({
                where: {
                    id: orderId,
                },
                include: {
                    items: true,
                },
            });

        expect(savedOrder).not.toBeNull();

        expect(
            savedOrder?.customerId,
        ).toBe(userId);

        expect(
            savedOrder?.pharmacyId,
        ).toBe(pharmacy.id);

        expect(
            savedOrder?.status,
        ).toBe('PENDING');

        expect(
            savedOrder?.items,
        ).toHaveLength(2);
    });

    // ============================================================
    // AUTHORIZATION
    // ============================================================

    it('rejects unauthenticated order creation', async () => {
        const pharmacy =
            await createPharmacy(
                'APPROVED',
                'OPEN',
            );

        await request(app.getHttpServer())
            .post('/api/v1/orders')
            .send({
                pharmacyId: pharmacy.id,
                deliveryAddress:
                    'Test Address',
                deliveryLatitude:
                    '35.5200000',
                deliveryLongitude:
                    '35.7800000',
                items: [
                    {
                        medicineName:
                            'Paracetamol',
                        quantity: 1,
                    },
                ],
            })
            .expect(401);
    });

    it('rejects internal sessions from customer order creation', async () => {
        const owner =
            await createUser('OWNER');

        const pharmacy =
            await createPharmacy(
                'APPROVED',
                'OPEN',
            );

        const token =
            await createInternalToken(
                owner.id,
            );

        await request(app.getHttpServer())
            .post('/api/v1/orders')
            .set(
                'Authorization',
                `Bearer ${token}`,
            )
            .send({
                pharmacyId: pharmacy.id,
                deliveryAddress:
                    'Test Address',
                deliveryLatitude:
                    '35.5200000',
                deliveryLongitude:
                    '35.7800000',
                items: [
                    {
                        medicineName:
                            'Paracetamol',
                        quantity: 1,
                    },
                ],
            })
            .expect(401);
    });

    // ============================================================
    // PHARMACY BUSINESS RULES
    // ============================================================

    it('rejects orders for a closed pharmacy', async () => {
        const {
            token,
        } = await authenticateCustomer();

        const pharmacy =
            await createPharmacy(
                'APPROVED',
                'CLOSED',
            );

        const response = await request(
            app.getHttpServer(),
        )
            .post('/api/v1/orders')
            .set(
                'Authorization',
                `Bearer ${token}`,
            )
            .send({
                pharmacyId: pharmacy.id,
                deliveryAddress:
                    'Test Address',
                deliveryLatitude:
                    '35.5200000',
                deliveryLongitude:
                    '35.7800000',
                items: [
                    {
                        medicineName:
                            'Paracetamol',
                        quantity: 1,
                    },
                ],
            })
            .expect(400);

        expect(
            response.body.message,
        ).toBe(
            'Pharmacy is currently closed',
        );
    });

    it('rejects orders for a pharmacy that is not approved', async () => {
        const {
            token,
        } = await authenticateCustomer();

        const pharmacy =
            await createPharmacy(
                'PENDING_APPROVAL',
                'CLOSED',
            );

        const response = await request(
            app.getHttpServer(),
        )
            .post('/api/v1/orders')
            .set(
                'Authorization',
                `Bearer ${token}`,
            )
            .send({
                pharmacyId: pharmacy.id,
                deliveryAddress:
                    'Test Address',
                deliveryLatitude:
                    '35.5200000',
                deliveryLongitude:
                    '35.7800000',
                items: [
                    {
                        medicineName:
                            'Paracetamol',
                        quantity: 1,
                    },
                ],
            })
            .expect(400);

        expect(
            response.body.message,
        ).toBe(
            'Pharmacy is not approved',
        );
    });

    // ============================================================
    // VALIDATION
    // ============================================================

    it('rejects an order without medicine items', async () => {
        const {
            token,
        } = await authenticateCustomer();

        const pharmacy =
            await createPharmacy(
                'APPROVED',
                'OPEN',
            );

        const response = await request(
            app.getHttpServer(),
        )
            .post('/api/v1/orders')
            .set(
                'Authorization',
                `Bearer ${token}`,
            )
            .send({
                pharmacyId: pharmacy.id,
                deliveryAddress:
                    'Test Address',
                deliveryLatitude:
                    '35.5200000',
                deliveryLongitude:
                    '35.7800000',
                items: [],
            })
            .expect(400);

        expect(
            response.body.message,
        ).toBe(
            'Order must contain at least one medicine',
        );
    });
});