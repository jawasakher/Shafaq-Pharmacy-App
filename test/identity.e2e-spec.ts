import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { TestOtpDeliveryService } from '../src/identity/test-otp-delivery.service.js';
import { OTP_DELIVERY } from '../src/identity/otp-delivery.port.js';

describe('Identity authentication (e2e)', () => {
  let app: INestApplication<App>;
  let otpDelivery: TestOtpDeliveryService;

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
  });

  afterEach(async () => {
    await app.close();
  });

  it('completes OTP login, reads /me, and revokes the session on logout', async () => {
    const phone = '+963991234567';

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
});
