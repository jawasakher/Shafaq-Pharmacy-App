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

    it('creates an offered pharmacy assignment and activates it on pharmacy acceptance', async () => {
        const customer = await authenticateCustomer();
        const owner = await createUser('OWNER');
        const pharmacy = await createPharmacy('APPROVED', 'OPEN');

        await prisma.pharmacyMember.create({
            data: {
                pharmacyId: pharmacy.id,
                userId: owner.id,
                role: 'OWNER',
                status: 'ACTIVE',
            },
        });

        const createResponse = await request(
            app.getHttpServer(),
        )
            .post('/api/v1/orders')
            .set('Authorization', `Bearer ${customer.token}`)
            .send({
                pharmacyId: pharmacy.id,
                deliveryAddress: 'Assignment Test Address',
                deliveryLatitude: '35.5200000',
                deliveryLongitude: '35.7800000',
                items: [
                    {
                        medicineName: 'Paracetamol',
                        quantity: 1,
                    },
                ],
            })
            .expect(201);

        const assignmentId =
            createResponse.body.assignments[0].id as string;
        createdOrderIds.add(createResponse.body.id as string);
        const ownerToken = await createInternalToken(owner.id);

        const acceptResponse = await request(
            app.getHttpServer(),
        )
            .post(
                `/api/v1/pharmacy/assignments/${assignmentId}/accept`,
            )
            .set('Authorization', `Bearer ${ownerToken}`)
            .expect(200);

        expect(acceptResponse.body.data.status).toBe('ACTIVE');
        expect(acceptResponse.body.data.order.status).toBe(
            'PHARMACY_REVIEWING',
        );
    });

    it('allows an active pharmacy member to quote the complete order and moves it to customer confirmation', async () => {
        const customer = await authenticateCustomer();
        const owner = await createUser('OWNER');
        const pharmacy = await createPharmacy('APPROVED', 'OPEN');

        await prisma.pharmacyMember.create({
            data: {
                pharmacyId: pharmacy.id,
                userId: owner.id,
                role: 'OWNER',
                status: 'ACTIVE',
            },
        });

        const createResponse = await request(
            app.getHttpServer(),
        )
            .post('/api/v1/orders')
            .set('Authorization', `Bearer ${customer.token}`)
            .send({
                pharmacyId: pharmacy.id,
                deliveryAddress: 'Quote Test Address',
                deliveryLatitude: '35.5200000',
                deliveryLongitude: '35.7800000',
                items: [
                    {
                        medicineName: 'Paracetamol',
                        quantity: 2,
                    },
                    {
                        medicineName: 'Vitamin C',
                        quantity: 1,
                    },
                ],
            })
            .expect(201);

        const orderId = createResponse.body.id as string;
        const assignmentId =
            createResponse.body.assignments[0].id as string;
        createdOrderIds.add(orderId);

        const ownerToken = await createInternalToken(owner.id);

        await request(app.getHttpServer())
            .post(
                `/api/v1/pharmacy/assignments/${assignmentId}/accept`,
            )
            .set('Authorization', `Bearer ${ownerToken}`)
            .expect(200);

        const previousBase = process.env.SHAFAQ_PRICING_BASE_FEE;
        const previousPerKm = process.env.SHAFAQ_PRICING_PER_KM;
        const previousMaxDistance =
            process.env.SHAFAQ_PRICING_MAX_DISTANCE_KM;

        process.env.SHAFAQ_PRICING_BASE_FEE = '100';
        process.env.SHAFAQ_PRICING_PER_KM = '10';
        process.env.SHAFAQ_PRICING_MAX_DISTANCE_KM = '100';

        try {
            const quoteResponse = await request(
                app.getHttpServer(),
            )
                .post(`/api/v1/orders/${orderId}/quote`)
                .set(
                    'Authorization',
                    `Bearer ${ownerToken}`,
                )
                .send({
                    items: [
                        {
                            orderItemId:
                                createResponse.body.items[0].id,
                            available: true,
                            unitPrice: 50,
                        },
                        {
                            orderItemId:
                                createResponse.body.items[1].id,
                            available: true,
                            unitPrice: 25,
                        },
                    ],
                    medicineSubtotal: 1,
                    deliveryFee: 1,
                })
                .expect(200);

            expect(quoteResponse.body.status).toBe(
                'CUSTOMER_CONFIRMATION_PENDING',
            );
            expect(
                quoteResponse.body.medicineSubtotal,
            ).toBe('125');
            expect(
                quoteResponse.body.currency,
            ).toBe('SYP');

            const deliveryFee =
                Number(quoteResponse.body.deliveryFee);
            const totalAmount =
                Number(quoteResponse.body.totalAmount);

            expect(deliveryFee).toBeGreaterThanOrEqual(100);
            expect(totalAmount).toBeCloseTo(
                125 + deliveryFee,
                2,
            );
            expect(
                quoteResponse.body.items,
            ).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        status: 'AVAILABLE',
                        unitPrice: '50',
                        totalPrice: '100',
                    }),
                    expect.objectContaining({
                        status: 'AVAILABLE',
                        unitPrice: '25',
                        totalPrice: '25',
                    }),
                ]),
            );
        } finally {
            if (previousBase === undefined) {
                delete process.env.SHAFAQ_PRICING_BASE_FEE;
            } else {
                process.env.SHAFAQ_PRICING_BASE_FEE =
                    previousBase;
            }

            if (previousPerKm === undefined) {
                delete process.env.SHAFAQ_PRICING_PER_KM;
            } else {
                process.env.SHAFAQ_PRICING_PER_KM =
                    previousPerKm;
            }

            if (previousMaxDistance === undefined) {
                delete process.env.SHAFAQ_PRICING_MAX_DISTANCE_KM;
            } else {
                process.env.SHAFAQ_PRICING_MAX_DISTANCE_KM =
                    previousMaxDistance;
            }
        }
    });

    it('does not finalize pricing when any requested medicine is unavailable', async () => {
        const customer = await authenticateCustomer();
        const pharmacist = await createUser('PHARMACIST');
        const pharmacy = await createPharmacy('APPROVED', 'OPEN');

        await prisma.pharmacyMember.create({
            data: {
                pharmacyId: pharmacy.id,
                userId: pharmacist.id,
                role: 'PHARMACIST',
                status: 'ACTIVE',
            },
        });

        const createResponse = await request(
            app.getHttpServer(),
        )
            .post('/api/v1/orders')
            .set('Authorization', `Bearer ${customer.token}`)
            .send({
                pharmacyId: pharmacy.id,
                deliveryAddress: 'Unavailable Medicine Address',
                deliveryLatitude: '35.5200000',
                deliveryLongitude: '35.7800000',
                items: [
                    {
                        medicineName: 'Paracetamol',
                        quantity: 1,
                    },
                    {
                        medicineName: 'Medicine X',
                        quantity: 1,
                    },
                ],
            })
            .expect(201);

        const orderId = createResponse.body.id as string;
        const assignmentId =
            createResponse.body.assignments[0].id as string;
        createdOrderIds.add(orderId);

        const pharmacistToken =
            await createInternalToken(
                pharmacist.id,
            );

        await request(app.getHttpServer())
            .post(
                `/api/v1/pharmacy/assignments/${assignmentId}/accept`,
            )
            .set(
                'Authorization',
                `Bearer ${pharmacistToken}`,
            )
            .expect(200);

        const quoteResponse = await request(
            app.getHttpServer(),
        )
            .post(`/api/v1/orders/${orderId}/quote`)
            .set(
                'Authorization',
                `Bearer ${pharmacistToken}`,
            )
            .send({
                items: [
                    {
                        orderItemId:
                            createResponse.body.items[0].id,
                        available: true,
                        unitPrice: 50,
                    },
                    {
                        orderItemId:
                            createResponse.body.items[1].id,
                        available: false,
                    },
                ],
            })
            .expect(200);

        expect(
            quoteResponse.body.status,
        ).toBe('PHARMACY_REVIEWING');
        expect(
            quoteResponse.body.medicineSubtotal,
        ).toBeNull();
        expect(
            quoteResponse.body.totalAmount,
        ).toBeNull();

        expect(
            quoteResponse.body.items,
        ).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    status: 'AVAILABLE',
                    unitPrice: '50',
                    totalPrice: '50',
                }),
                expect.objectContaining({
                    status: 'UNAVAILABLE',
                    unitPrice: null,
                    totalPrice: null,
                }),
            ]),
        );
    });

    it('rejects ADMIN from normal pharmacy assignment acceptance', async () => {
        const customer = await authenticateCustomer();
        const admin = await createUser('ADMIN');
        const pharmacy = await createPharmacy('APPROVED', 'OPEN');

        const createResponse = await request(
            app.getHttpServer(),
        )
            .post('/api/v1/orders')
            .set('Authorization', `Bearer ${customer.token}`)
            .send({
                pharmacyId: pharmacy.id,
                deliveryAddress: 'Admin Assignment Address',
                deliveryLatitude: '35.5200000',
                deliveryLongitude: '35.7800000',
                items: [
                    {
                        medicineName: 'Paracetamol',
                        quantity: 1,
                    },
                ],
            })
            .expect(201);

        const orderId = createResponse.body.id as string;
        const assignmentId =
            createResponse.body.assignments[0].id as string;
        createdOrderIds.add(orderId);

        const adminToken =
            await createInternalToken(admin.id);

        await request(app.getHttpServer())
            .post(
                `/api/v1/pharmacy/assignments/${assignmentId}/accept`,
            )
            .set(
                'Authorization',
                `Bearer ${adminToken}`,
            )
            .expect(403);

        const assignment =
            await prisma.pharmacyAssignment.findUnique({
                where: { id: assignmentId },
                select: { status: true },
            });

        expect(assignment?.status).toBe('OFFERED');
    });

    it('transfers a reviewing order only after the receiving pharmacy accepts', async () => {
        const customer = await authenticateCustomer();
        const currentOwner = await createUser('OWNER');
        const receivingOwner = await createUser('OWNER');
        const currentPharmacy = await createPharmacy(
            'APPROVED',
            'OPEN',
        );
        const receivingPharmacy = await createPharmacy(
            'APPROVED',
            'OPEN',
        );

        await prisma.pharmacyMember.createMany({
            data: [
                {
                    pharmacyId: currentPharmacy.id,
                    userId: currentOwner.id,
                    role: 'OWNER',
                    status: 'ACTIVE',
                },
                {
                    pharmacyId: receivingPharmacy.id,
                    userId: receivingOwner.id,
                    role: 'OWNER',
                    status: 'ACTIVE',
                },
            ],
        });

        const createResponse = await request(
            app.getHttpServer(),
        )
            .post('/api/v1/orders')
            .set(
                'Authorization',
                `Bearer ${customer.token}`,
            )
            .send({
                pharmacyId: currentPharmacy.id,
                deliveryAddress: 'Transfer Test Address',
                deliveryLatitude: '35.5200000',
                deliveryLongitude: '35.7800000',
                items: [
                    {
                        medicineName: 'Paracetamol',
                        quantity: 1,
                    },
                ],
            })
            .expect(201);

        const orderId =
            createResponse.body.id as string;
        const originalAssignmentId =
            createResponse.body.assignments[0].id as string;
        createdOrderIds.add(orderId);

        const currentOwnerToken =
            await createInternalToken(
                currentOwner.id,
            );
        const receivingOwnerToken =
            await createInternalToken(
                receivingOwner.id,
            );

        await request(app.getHttpServer())
            .post(
                `/api/v1/pharmacy/assignments/${originalAssignmentId}/accept`,
            )
            .set(
                'Authorization',
                `Bearer ${currentOwnerToken}`,
            )
            .expect(200);

        const transferResponse =
            await request(app.getHttpServer())
                .post(
                    `/api/v1/orders/${orderId}/transfer`,
                )
                .set(
                    'Authorization',
                    `Bearer ${currentOwnerToken}`,
                )
                .send({
                    targetPharmacyId:
                        receivingPharmacy.id,
                })
                .expect(201);

        const offeredAssignmentId =
            transferResponse.body.id as string;

        expect(
            transferResponse.body.status,
        ).toBe('OFFERED');

        const beforeAcceptance =
            await prisma.pharmacyAssignment.findMany({
                where: { orderId },
                select: {
                    id: true,
                    pharmacyId: true,
                    status: true,
                },
                orderBy: {
                    createdAt: 'asc',
                },
            });

        expect(beforeAcceptance).toEqual([
            expect.objectContaining({
                id: originalAssignmentId,
                pharmacyId: currentPharmacy.id,
                status: 'ACTIVE',
            }),
            expect.objectContaining({
                id: offeredAssignmentId,
                pharmacyId: receivingPharmacy.id,
                status: 'OFFERED',
            }),
        ]);

        await request(app.getHttpServer())
            .post(
                `/api/v1/pharmacy/assignments/${offeredAssignmentId}/accept`,
            )
            .set(
                'Authorization',
                `Bearer ${receivingOwnerToken}`,
            )
            .expect(200);

        const assignments =
            await prisma.pharmacyAssignment.findMany({
                where: { orderId },
                select: {
                    id: true,
                    pharmacyId: true,
                    status: true,
                },
                orderBy: {
                    createdAt: 'asc',
                },
            });

        expect(assignments).toEqual([
            expect.objectContaining({
                id: originalAssignmentId,
                pharmacyId: currentPharmacy.id,
                status: 'TRANSFERRED',
            }),
            expect.objectContaining({
                id: offeredAssignmentId,
                pharmacyId: receivingPharmacy.id,
                status: 'ACTIVE',
            }),
        ]);

        const order =
            await prisma.order.findUnique({
                where: { id: orderId },
                select: {
                    status: true,
                    pharmacyId: true,
                },
            });

        expect(order?.status).toBe(
            'PHARMACY_REVIEWING',
        );
        expect(order?.pharmacyId).toBe(
            currentPharmacy.id,
        );
    });

    it('rejects assignment acceptance from an inactive pharmacy owner membership', async () => {
        const customer = await authenticateCustomer();
        const owner = await createUser('OWNER');
        const pharmacy = await createPharmacy('APPROVED', 'OPEN');

        await prisma.pharmacyMember.create({
            data: {
                pharmacyId: pharmacy.id,
                userId: owner.id,
                role: 'OWNER',
                status: 'INACTIVE',
            },
        });

        const createResponse = await request(
            app.getHttpServer(),
        )
            .post('/api/v1/orders')
            .set('Authorization', `Bearer ${customer.token}`)
            .send({
                pharmacyId: pharmacy.id,
                deliveryAddress: 'Inactive Owner Address',
                deliveryLatitude: '35.5200000',
                deliveryLongitude: '35.7800000',
                items: [
                    {
                        medicineName: 'Paracetamol',
                        quantity: 1,
                    },
                ],
            })
            .expect(201);

        const orderId = createResponse.body.id as string;
        const assignmentId =
            createResponse.body.assignments[0].id as string;
        createdOrderIds.add(orderId);
        const ownerToken = await createInternalToken(owner.id);

        await request(app.getHttpServer())
            .post(
                `/api/v1/pharmacy/assignments/${assignmentId}/accept`,
            )
            .set('Authorization', `Bearer ${ownerToken}`)
            .expect(400);

        const assignment = await prisma.pharmacyAssignment.findUnique({
            where: { id: assignmentId },
            select: { status: true },
        });
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: { status: true },
        });

        expect(assignment?.status).toBe('OFFERED');
        expect(order?.status).toBe('PENDING');
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