import { Injectable, Logger } from '@nestjs/common';
import emailjs from '@emailjs/nodejs';
import nodemailer from 'nodemailer';
import { OtpDeliveryPort } from './otp-delivery.port.js';

@Injectable()
export class EmailJsOtpDeliveryService implements OtpDeliveryPort {
  private readonly logger = new Logger(EmailJsOtpDeliveryService.name);

  async sendOtp(target: string, code: string, name?: string): Promise<void> {
    const serviceId = process.env.EMAILJS_SERVICE_ID || 'service_xkcg30e';
    const templateId = process.env.EMAILJS_TEMPLATE_ID || 'template_x9cej8i';
    const publicKey = process.env.EMAILJS_PUBLIC_KEY || 'ZxMMJkm-_M6bVhfLD';
    const privateKey = process.env.EMAILJS_PRIVATE_KEY || 'fzOoY3T0c5MuOr-ce4Wv1';

    // 1. ALWAYS print the OTP code in local server logs
    console.log('\n======================================================');
    console.log(`🔑 [SHAFAQ OTP CODE FOR ${target}]: ==> ${code} <==`);
    console.log('======================================================\n');

    // 2. Try Nodemailer if SMTP / Gmail credentials are configured
    const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_PASS;

    if (smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        await transporter.sendMail({
          from: `"منصة شَفَق" <${smtpUser}>`,
          to: target,
          subject: 'رمز التحقق الخاص بك من منصة شَفَق 🛡️',
          html: `
            <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; color: #16485C; background-color: #F4FCFE;">
              <h2>مرحباً ${name || 'مستخدم شفق'}،</h2>
              <p>رمز التحقق (OTP) الخاص بك لإكمال الدخول إلى منصة شَفَق هو:</p>
              <h1 style="color: #19A9CC; letter-spacing: 4px;">${code}</h1>
              <p>هذا الرمز صالح لمدة 5 دقائق فقط. لا تشاركه مع أي شخص.</p>
            </div>
          `,
        });
        this.logger.log(`OTP delivered directly to ${target} via Nodemailer Gmail SMTP`);
        return;
      } catch (smtpError) {
        this.logger.warn(`Nodemailer SMTP failed: ${smtpError}`);
      }
    }

    // 3. Send via EmailJS SDK passing ALL common variable names for templates
    try {
      emailjs.init({ publicKey, privateKey });
      const res = await emailjs.send(serviceId, templateId, {
        to_email: target,
        email: target,
        user_email: target,
        recipient_email: target,
        to_name: name || 'مستخدم شفق',
        user_name: name || 'مستخدم شفق',
        otp_code: code,
        otp: code,
        code: code,
        verification_code: code,
        passcode: code,
        pin: code,
        token: code,
        user_code: code,
        message: code,
        content: code,
        text: code,
        val: code,
        value: code,
        number: code,
      });

      this.logger.log(`OTP successfully delivered to ${target} via EmailJS (Status: ${res.status})`);
    } catch (error: any) {
      this.logger.error(`Could not dispatch EmailJS email: ${error?.text || error?.message || error}`);
    }
  }
}
