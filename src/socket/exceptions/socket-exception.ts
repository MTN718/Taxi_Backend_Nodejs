export default class SocketException {
    status: SocketStatus;
    message: string;
    constructor(status: SocketStatus, message: string) {
      this.status = status;
      this.message = message;
    }
}

export enum SocketStatus {
  DestinationTooFar = "DestinationTooFar",
  DistanceCalculationFailed = "DistanceCalculationFailed",
  DriversUnavailable = "DriversUnavailable",
  ConfirmationCodeRequired = 'ConfirmationCodeRequired',
  ConfirmationCodeInvalid = 'ConfirmationCodeInvalid',
  OrderAlreadyTaken = 'OrderAlreadyTaken',
  CreditInsufficient = 'CreditInsufficient',
  CouponUsed = 'CouponUsed',
  CouponExpired = 'CouponExpired',
  CouponInvalid = 'CouponInvalid',
  RegionUnsupported = 'RegionUnsupported',
  NoServiceInRegion = 'NoServiceInRegion',
  PINCodeRequired = 'PINCodeRequired',
  OTPCodeRequired = 'OTPCodeRequired',
  Unknown = 'Unknown'
}