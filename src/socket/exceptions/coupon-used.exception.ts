import SocketException, { SocketStatus } from './socket-exception'

export default class CouponUsedRequired extends SocketException {
    constructor() {
        super(SocketStatus.CouponUsed, 'Coupon has been used');
    }
}