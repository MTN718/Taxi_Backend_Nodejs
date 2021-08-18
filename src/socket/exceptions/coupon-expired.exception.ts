import SocketException, { SocketStatus } from './socket-exception'

export default class CouponExpiredRequired extends SocketException {
    constructor() {
        super(SocketStatus.CouponExpired, 'Coupon has been expired');
    }
}