import SocketController from "../interfaces/socket.controller.interface";
import { Coupon } from "../../entities/coupon";
import { Request } from "../../entities/request";
import CouponInvalidRequired from "../exceptions/coupon-invalid.exception";
import CouponUsedRequired from "../exceptions/coupon-used.exception";
import CouponExpiredRequired from "../exceptions/coupon-expired.exception";
import { Rider } from "../../entities/rider";
import UnknowException from "../exceptions/unknown.exception";
import SocketException from "../exceptions/socket-exception";

export default class CouponsController extends SocketController {
    constructor(socket: any) {
        super(socket)
        this.socket.on('AddCoupon', this.addCoupon.bind(this))
        this.socket.on('GetCoupons', this.getCoupons.bind(this))
        this.socket.on('ApplyCoupon', this.applyCoupon.bind(this))
    }

    async getCoupons(callback: (arg0: Coupon[] | SocketException) => void) {
        try {
            const now = new Date().getTime();
            let coupons = (await Rider.findOne(this.socket.user.id, {relations: ['coupons', 'coupons.requests']})).coupons;
            callback(coupons.filter(x=>x.startTimestamp < now && x.expirationTimestamp > now && x.isEnabled == true && x.requests.length < x.manyTimesUserCanUse));
        } catch (e) {
            callback(new UnknowException(e.message));
        }
    }
    
    async addCoupon(code: string, callback: (arg0?: SocketException) => void) {
        try {
            let coupon = await Coupon.findOne({where: {code: code, isEnabled: true}, relations: ['riders']});
            if (!coupon || (coupon.riders.length >= coupon.manyUsersCanUse && coupon.manyUsersCanUse != 0)) {
                callback(new CouponInvalidRequired());
                return;
            }
            let rider = (await Rider.findOne(this.socket.user.id, {relations: ['coupons']}));
            if (rider.coupons.find(x=>x.code == code) != null) {
                callback(new CouponUsedRequired());
                return;
            }
            if (coupon.expirationTimestamp < new Date().getTime()) {
                callback(new CouponExpiredRequired());
                return;
            }
            rider.coupons.push(await Coupon.findOne({code: code}));
            await rider.save();
            callback();
        } catch (e) {
            callback(new UnknowException(e.message));
        }
    }

    async applyCoupon(code: string, callback: (arg0: number | SocketException) => void) {
        try {
            let coupon = await Coupon.findOne({ where: { code: code } });
            let request = await Request.findOne({ where: { rider: { id: this.socket.user.id } }, order: { id: 'DESC' } });
            let finalCost = request.costBest;
            finalCost = finalCost * ((100 - coupon.discountPercent) / 100);
            finalCost = finalCost - coupon.discountFlat;
            Request.update(request.id, { coupon, costAfterCoupon: finalCost });
            callback(finalCost);
        } catch (e) {
            callback(new UnknowException(e.message));
        }
    }
}