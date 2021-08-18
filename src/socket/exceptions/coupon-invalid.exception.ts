import SocketException, { SocketStatus } from './socket-exception'

export default class CouponInvalidRequired extends SocketException {
    constructor() {
        super(SocketStatus.CouponInvalid, 'Coupon is invalid');
    }
}