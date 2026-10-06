import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { TestOtpDeliveryService } from '../src/identity/test-otp-delivery.service.js';
import { OTP_DELIVERY } from '../src/identity/otp-delivery.port.js';
import { AuthSessionService } from '../src/identity/auth-session.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Identity authentication (e2e)', () => {
  let app: INestApplication<App>;
  let phoneSequence = 0;

  const nextTestPhone = () =>
    `+963991${Date.now().toString().slice(-6)}${++phoneSequence}`;
  let otpDelivery: TestOtpDeliveryService;
  let prisma: PrismaService;
  let sessions: AuthSessionService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(OTP_DELIVERY)
      .useClass(TestOtpDeliveryService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    otpDelivery = app.get<TestOtpDeliveryService>(OTP_DELIVERY);
    prisma = app.get(PrismaService);
    sessions = app.get(AuthSessionService);
  });

  afterEach(async () => {
    await app.close();
  });

  it('completes OTP login, reads /me, and revokes the session on logout', async () => {
    const phone = nextTestPhone();

    await request(app.getHttpServer())
      .post('/api/v1/auth/otp/request')
      .set('x-device-id', 'e2e-device-identity')
      .send({ phone })
      .expect(201)
      .expect(({ body }) => {
        expect(body.success).toBe(true);
        expect(body.data.accepted).toBe(true);
        expect(body.data).not.toHaveProperty('code');
      });

    const code = otpDelivery.getCode(phone);
    expect(code).toMatch(/^\d{6}$/);

    const verifyResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/otp/verify')
      .send({ phone, code })
      .expect(201);

    expect(verifyResponse.body.success).toBe(true);
    expect(verifyResponse.body.data.user.phone).toBe(phone);
    expect(verifyResponse.body.data.user.role).toBe('CUSTOMER');

    const token = verifyResponse.body.data.session.token;
    expect(token).toEqual(expect.any(String));

    await request(app.getHttpServer())
      .get('/api/v1/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.success).toBe(true);
        expect(body.data.phone).toBe(phone);
        expect(body.data.role).toBe('CUSTOMER');
      });

    await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${token}`)
      .expect(201)
      .expect(({ body }) => {
        expect(body.success).toBe(true);
        expect(body.data).toBeNull();
      });

    await request(app.getHttpServer())
      .get('/api/v1/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);
  });

  it('rejects a second OTP request while the first OTP is still valid', async () => {
    const phone = nextTestPhone();

    await request(app.getHttpServer())
      .post('/api/v1/auth/otp/request')
      .set('x-device-id', 'e2e-device-valid-otp')
      .send({ phone })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/auth/otp/request')
      .set('x-device-id', 'e2e-device-valid-otp-2')
      .send({ phone })
      .expect(409);
  });

  it('rejects an incorrect OTP and blocks verification after five failed attempts', async () => {
    const phone = nextTestPhone();

    await request(app.getHttpServer())
      .post('/api/v1/auth/otp/request')
      .set('x-device-id', 'e2e-device-attempts')
      .send({ phone })
      .expect(201);

    for (let attempt = 1; attempt <= 5; attempt += 1) {
      await request(app.getHttpServer())
        .post('/api/v1/auth/otp/verify')
        .send({ phone, code: '000000' })
        .expect(attempt === 5 ? 401 : 401);
    }

    await request(app.getHttpServer())
      .post('/api/v1/auth/otp/verify')
      .send({ phone, code: '000000' })
      .expect(429);
  });

  it('does not allow the same OTP to be consumed twice', async () => {
    const phone = nextTestPhone();

    await request(app.getHttpServer())
      .post('/api/v1/auth/otp/request')
      .set('x-device-id', 'e2e-device-replay')
      .send({ phone })
      .expect(201);

    const code = otpDelivery.getCode(phone);
    expect(code).toMatch(/^\d{6}$/);

    await request(app.getHttpServer())
      .post('/api/v1/auth/otp/verify')
      .send({ phone, code })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/auth/otp/verify')
      .send({ phone, code })
      .expect(401);
  });

  it('allows only one concurrent OTP request for the same phone', async () => {
    const phone = nextTestPhone();

    const results = await Promise.all(
      [1, 2].map((index) =>
        request(app.getHttpServer())
          .post('/api/v1/auth/otp/request')
          .set('x-device-id', `e2e-device-race-${index}`)
          .send({ phone }),
      ),
    );

    const statuses = results
      .map((result) => result.status)
      .sort((a, b) => a - b);
    expect(statuses).toEqual([201, 409]);
  });

  it('creates an internal session and enforces its session type', async () => {
    const phone = nextTestPhone();

    const user = await prisma.user.create({
      data: {
        phone,
        role: 'ADMIN',
      },
    });

    const session = await sessions.createInternalSession(user.id);
    const authenticated = await sessions.authenticate(session.token, 'INTERNAL');

    expect(authenticated.id).toBe(user.id);
    expect(authenticated.role).toBe('ADMIN');

    await expect(
      sessions.authenticate(session.token, 'CUSTOMER'),
    ).rejects.toThrow('Invalid or expired session');

    await prisma.user.delete({ where: { id: user.id } });
  });

});
