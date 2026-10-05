import { rm } from 'node:fs/promises';

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

describe('Prescription API (e2e)', () => {
    let app: INestApplication<App>;
    let prisma: PrismaService;
    let otpDelivery: TestOtpDeliveryService;
    let storagePath: string;

    const createdUserIds = new Set<string>();
    const createdOrderIds = new Set<string>();
    const createdPharmacyIds = new Set<string>();

    let phoneSequence = 0;

    const nextPhone = () =>
        '+963992' +
        Date.now().toString().slice(-6) +
        (++phoneSequence);

    beforeEach(async () => {
        process.env.SHAFAQ_STORAGE_SIGNING_SECRET =
            'e2e-prescription-secret';
        process.env.SHAFAQ_PRESCRIPTION_MAX_BYTES =
            String(1024 * 1024);

        storagePath =
            './.tmp/prescription-e2e-' +
            Date.now() +
            '-' +
            Math.random().toString(16).slice(2);

        process.env.SHAFAQ_PRIVATE_STORAGE_PATH = storagePath;

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
        otpDelivery = app.get(TestOtpDeliveryService);
    });

    afterEach(async () => {
        try {
            if (createdOrderIds.size) {
                await prisma.order.deleteMany({
                    where: {
                        id: { in: [...createdOrderIds] },
                    },
                });
            }

            if (createdPharmacyIds.size) {
                await prisma.pharmacy.deleteMany({
                    where: {
                        id: { in: [...createdPharmacyIds] },
                    },
                });
            }

            if (createdUserIds.size) {
                await prisma.user.deleteMany({
                    where: {
                        id: { in: [...createdUserIds] },
                    },
                });
            }
        } finally {
            createdOrderIds.clear();
            createdPharmacyIds.clear();
            createdUserIds.clear();

            await app.close();
            await rm(storagePath, {
                recursive: true,
                force: true,
            });
        }
    });

    async function authenticateCustomer() {
        const phone = nextPhone();

        await request(app.getHttpServer())
            .post('/api/v1/auth/otp/request')
            .set('x-device-id', 'e2e-prescription-' + phone)
            .send({ phone })
            .expect(201);

        const code = otpDelivery.getCode(phone);

        const response = await request(app.getHttpServer())
            .post('/api/v1/auth/otp/verify')
            .send({ phone, code })
            .expect(201);

        const userId = response.body.data.user.id as string;
        createdUserIds.add(userId);

        return {
            userId,
            token: response.body.data.session.token as string,
        };
    }

    async function createUser(
        role: 'OWNER' | 'PHARMACIST' | 'CUSTOMER',
    ) {
        const user = await prisma.user.create({
            data: {
                phone: nextPhone(),
                role,
            },
        });

        createdUserIds.add(user.id);
        return user;
    }

    async function createInternalToken(userId: string) {
        return (
            await app
                .get(AuthSessionService)
                .createInternalSession(userId)
        ).token;
    }

    async function createPrescriptionFixture() {
        const customer = await authenticateCustomer();
        const owner = await createUser('OWNER');

        const pharmacy =
            await prisma.pharmacy.create({
                data: {
                    name: 'E2E Prescription Pharmacy',
                    phone: '+963991234567',
                    address: 'Prescription Test Address',
                    latitude: 35.5141,
                    longitude: 35.7767,
                    approvalStatus: 'APPROVED',
                    operationalStatus: 'OPEN',
                    members: {
                        create: {
                            userId: owner.id,
                            role: 'OWNER',
                            status: 'ACTIVE',
                        },
                    },
                },
            });

        createdPharmacyIds.add(pharmacy.id);

        const order =
            await prisma.order.create({
                data: {
                    customerId: customer.userId,
                    pharmacyId: pharmacy.id,
                    status: 'PHARMACY_REVIEWING',
                    deliveryAddress: 'Customer Address',
                    deliveryLatitude: 35.52,
                    deliveryLongitude: 35.78,
                    items: {
                        create: {
                            medicineName: 'Paracetamol',
                            quantity: 1,
                            status: 'PENDING',
                        },
                    },
                    assignments: {
                        create: {
                            pharmacyId: pharmacy.id,
                            status: 'ACTIVE',
                            activatedAt: new Date(),
                        },
                    },
                },
            });

        createdOrderIds.add(order.id);

        return {
            customer,
            owner,
            order,
            ownerToken: await createInternalToken(owner.id),
        };
    }

    const png = Buffer.from([
        0x89, 0x50, 0x4e, 0x47,
        0x0d, 0x0a, 0x1a, 0x0a,
    ]);

    it('uploads a private prescription and returns a signed temporary URL', async () => {
        const fixture = await createPrescriptionFixture();

        const upload = await request(app.getHttpServer())
            .post(
                '/api/v1/orders/' +
                    fixture.order.id +
                    '/prescription',
            )
            .set(
                'Authorization',
                'Bearer ' + fixture.customer.token,
            )
            .attach('file', png, {
                filename: 'prescription.png',
                contentType: 'image/png',
            })
            .expect(201);

        expect(upload.body.status).toBe('UPLOADED');
        expect(upload.body.latestVersion.version).toBe(1);
        expect(upload.body.latestVersion.mimeType).toBe(
            'image/png',
        );

        const prescription =
            await prisma.prescription.findUnique({
                where: {
                    orderId: fixture.order.id,
                },
                include: { versions: true },
            });

        expect(prescription).not.toBeNull();
        expect(prescription?.versions).toHaveLength(1);
        expect(prescription?.versions[0].storageKey).not.toContain(
            'prescription.png',
        );

        const getResponse =
            await request(app.getHttpServer())
                .get(
                    '/api/v1/orders/' +
                        fixture.order.id +
                        '/prescription',
                )
                .set(
                    'Authorization',
                    'Bearer ' + fixture.customer.token,
                )
                .expect(200);

        expect(getResponse.body.downloadUrl).toMatch(
            /\\/api\\/v1\\/prescriptions\\/file\\?token=/,
        );

        const signedPath =
            new URL(getResponse.body.downloadUrl).pathname +
            new URL(getResponse.body.downloadUrl).search;

        const fileResponse = await request(
            app.getHttpServer(),
        )
            .get(signedPath)
            .expect(200);

        expect(fileResponse.body).toEqual(
            Buffer.from(png),
        );
    });

    it('allows only the responsible pharmacy member to review and supports reupload', async () => {
        const fixture = await createPrescriptionFixture();

        const upload = await request(app.getHttpServer())
            .post(
                '/api/v1/orders/' +
                    fixture.order.id +
                    '/prescription',
            )
            .set(
                'Authorization',
                'Bearer ' + fixture.customer.token,
            )
            .attach('file', png, {
                filename: 'first.png',
                contentType: 'image/png',
            })
            .expect(201);

        const prescriptionId =
            upload.body.id as string;

        const review =
            await request(app.getHttpServer())
                .post(
                    '/api/v1/prescriptions/' +
                        prescriptionId +
                        '/review',
                )
                .set(
                    'Authorization',
                    'Bearer ' + fixture.ownerToken,
                )
                .send({
                    decision: 'REUPLOAD',
                    rejectionReason: 'Image is not clear',
                })
                .expect(201);

        expect(review.body.status).toBe(
            'REUPLOAD_REQUIRED',
        );

        await request(app.getHttpServer())
            .post(
                '/api/v1/prescriptions/' +
                    prescriptionId +
                    '/reupload',
            )
            .set(
                'Authorization',
                'Bearer ' + fixture.customer.token,
            )
            .attach('file', png, {
                filename: 'second.png',
                contentType: 'image/png',
            })
            .expect(201);

        const saved =
            await prisma.prescription.findUnique({
                where: { id: prescriptionId },
                include: {
                    versions: {
                        orderBy: { version: 'asc' },
                    },
                },
            });

        expect(saved?.status).toBe('UPLOADED');
        expect(saved?.versions).toHaveLength(2);
        expect(saved?.versions[1].version).toBe(2);
        expect(saved?.versions[1].status).toBe('UPLOADED');

        const accepted =
            await request(app.getHttpServer())
                .post(
                    '/api/v1/prescriptions/' +
                        prescriptionId +
                        '/review',
                )
                .set(
                    'Authorization',
                    'Bearer ' + fixture.ownerToken,
                )
                .send({ decision: 'ACCEPT' })
                .expect(201);

        expect(accepted.body.status).toBe('ACCEPTED');
    });

    it('rejects prescription review from a non-member and rejects invalid file types', async () => {
        const fixture = await createPrescriptionFixture();
        const outsider = await createUser('OWNER');
        const outsiderToken =
            await createInternalToken(outsider.id);

        const upload = await request(app.getHttpServer())
            .post(
                '/api/v1/orders/' +
                    fixture.order.id +
                    '/prescription',
            )
            .set(
                'Authorization',
                'Bearer ' + fixture.customer.token,
            )
            .attach(
                'file',
                Buffer.from('not an image'),
                {
                    filename: 'note.txt',
                    contentType: 'text/plain',
                },
            )
            .expect(400);

        expect(upload.body.message).toBe(
            'Prescription file is required',
        );

        const validUpload =
            await request(app.getHttpServer())
                .post(
                    '/api/v1/orders/' +
                        fixture.order.id +
                        '/prescription',
                )
                .set(
                    'Authorization',
                    'Bearer ' + fixture.customer.token,
                )
                .attach('file', png, {
                    filename: 'valid.png',
                    contentType: 'image/png',
                })
                .expect(201);

        await request(app.getHttpServer())
            .post(
                '/api/v1/prescriptions/' +
                    validUpload.body.id +
                    '/review',
            )
            .set(
                'Authorization',
                'Bearer ' + outsiderToken,
            )
            .send({ decision: 'ACCEPT' })
            .expect(400);
    });

    it('does not allow another customer to read the prescription', async () => {
        const fixture = await createPrescriptionFixture();
        const otherCustomer =
            await authenticateCustomer();

        await request(app.getHttpServer())
            .post(
                '/api/v1/orders/' +
                    fixture.order.id +
                    '/prescription',
            )
            .set(
                'Authorization',
                'Bearer ' + fixture.customer.token,
            )
            .attach('file', png, {
                filename: 'private.png',
                contentType: 'image/png',
            })
            .expect(201);

        await request(app.getHttpServer())
            .get(
                '/api/v1/orders/' +
                    fixture.order.id +
                    '/prescription',
            )
            .set(
                'Authorization',
                'Bearer ' +
                    otherCustomer.token,
            )
            .expect(400);
    });
});
