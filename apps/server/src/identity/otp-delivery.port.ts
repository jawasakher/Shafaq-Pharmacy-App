export const OTP_DELIVERY = Symbol('OTP_DELIVERY');

export interface OtpDeliveryPort {
  sendOtp(target: string, code: string, contextName?: string): Promise<void>;
}
