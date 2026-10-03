export const OTP_DELIVERY = Symbol('OTP_DELIVERY');

export interface OtpDeliveryPort {
  sendOtp(phone: string, code: string): Promise<void>;
}
