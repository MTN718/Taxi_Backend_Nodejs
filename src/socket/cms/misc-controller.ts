import SocketController from "../interfaces/socket.controller.interface";
import { PaymentRequest, PaymenRequestStatus } from "../../entities/payment-request";
import { Driver } from "../../entities/driver";
import { DriverTransaction } from "../../entities/driver-transaction";
import { Rider } from "../../entities/rider";
import { RiderTransaction, TransactionType } from "../../entities/rider-transaction";
import { DriverWallet } from "../../entities/driver-wallet";

export default class MiscController extends SocketController {
    constructor(socket: any) {
        super(socket)
        socket.on('markPaymentRequestsPaid', this.markPaymentRequestsPaid.bind(this));
        socket.on('chargeDriver', this.chargeDriver.bind(this));
        socket.on('chargeRider', this.chargeRider.bind(this));
    }

    async markPaymentRequestsPaid(ids: number[], callback) {
        for(const id of ids) {
            let request = await PaymentRequest.findOne(id, { relations: ['driver'] });
            await PaymentRequest.update(id, { status: PaymenRequestStatus.Paid, paymentTimestamp: new Date().getTime() });
            await DriverWallet.delete({driver: {id: request.driver.id}});
        }
        callback(200);
    }

    async chargeDriver(dto: ChargeDriverDto, callback) {
        let driver = await Driver.findOne(dto.driverId, {relations: ['wallet']});
        await driver.addToWallet(parseFloat(dto.amount), dto.currency);
        await DriverTransaction.insert({
            driver: { id : dto.driverId },
            amount: parseFloat(dto.amount),
            currency: dto.currency,
            transactionType: dto.transactionType as TransactionType,
            documentNumber: dto.documentNumber,
            operator: { id: this.socket.user.id }
        });
        callback(200);
    }

    async chargeRider(dto: ChargeRiderDto, callback) {
        let rider = await Rider.findOne(dto.riderId, {relations: ['wallet']});
        rider.addToWallet(parseFloat(dto.amount), dto.currency);
        await RiderTransaction.insert({
            rider: { id : dto.riderId },
            amount: parseFloat(dto.amount),
            currency: dto.currency,
            transactionType: TransactionType[dto.transactionType],
            documentNumber: dto.documentNumber
        })
        callback(200);
    }
}

export interface ChargeDriverDto {
    driverId: number;
    transactionType: string;
    documentNumber: string;
    currency: string;
    amount: string;
    details: string;
}

export interface ChargeRiderDto {
    riderId: number;
    transactionType: string;
    documentNumber: string;
    currency: string;
    amount: string;
    details: string;
}