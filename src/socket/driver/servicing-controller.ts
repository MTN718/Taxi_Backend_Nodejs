import SocketController from "../interfaces/socket.controller.interface";
import Container from "typedi";
import { Request, RequestStatus } from "../../entities/request";
import { Driver, DriverStatus } from "../../entities/driver";
import { FeeEstimationMode, PaymentMethod } from "../../entities/service";
import { RiderTransaction, TransactionType } from "../../entities/rider-transaction";
import { DriverTransaction } from "../../entities/driver-transaction";
import ConfirmationCodeInvalid from '../exceptions/confirmation-code-invalid';
import ConfirmationCodeRequired from '../exceptions/confirmation-code-required';
import Notifier from "../../libs/notifier/notifier";
import SocketException from "../exceptions/socket-exception";
import UnknownException from "../exceptions/unknown.exception";
import { DriverWallet } from "../../entities/driver-wallet";
import { AdminTransaction, AdminTransactionType } from "../../entities/admin-transaction";
import { AdminWallet } from "../../entities/admin-wallet";
import { FleetTransaction, FleetTransactionType } from "../../entities/fleet-transaction";
import { Stats } from "../../models/stats";

export default class ServicingController extends SocketController {
    constructor(socket: any) {
        super(socket)
        socket.on('Start', this.start.bind(this));
        socket.on('Arrived', this.arrived.bind(this));
        socket.on('Finish', this.finish.bind(this));
        socket.on('PaidInCash', this.paidInCash.bind(this));
    }

    async arrived(callback: (arg0: Request) => void) {
        let requestId = (await Request.findOne({ where: { driver: { id: this.socket.user.id } }, order: { id: 'DESC'} })).id;
        await Request.update(requestId, {status: RequestStatus.Arrived, startTimestamp: new Date().getTime()});
        let request = await Request.findOne(requestId, {relations: ['rider', 'driver', 'driver.media', 'service']});
        callback(request);
        const riderConnectionId = Container.get('riders')[request.rider.id];
        if(riderConnectionId == null) {
            Container.get(Notifier).rider.arrived(request.rider);
        } else {
            (Container.get('io') as any).of('/riders').to(riderConnectionId).emit('arrived', request);
        }
    }

    async start(callback: (arg0: Request) => void) {
        let requestId = (await Request.findOne({ where: { driver: { id: this.socket.user.id } }, order: { id: 'DESC'} })).id;
        await Request.update(requestId, {status: RequestStatus.Started, startTimestamp: new Date().getTime()});
        let request = await Request.findOne(requestId, {relations: ['rider', 'driver', 'driver.media', 'service']});
        callback(request);
        const riderConnectionId = Container.get('riders')[request.rider.id];
        if(riderConnectionId == null) {
            Container.get(Notifier).rider.started(request.rider);
        } else {
            (Container.get('io') as any).of('/riders').to(riderConnectionId).emit('started', request);
        }
    }

    async finish(object: FinishTaxiDto, callback) {
        let request = await Request.findOne({ where: { driver: { id: this.socket.user.id } }, order: { id: 'DESC'}, relations: ['rider', 'rider.wallet','driver', 'service', 'coupon' ] });
        await Driver.update(this.socket.user.id, {status: DriverStatus.Online});
        Container.get(Stats).availableDrivers = Container.get(Stats).availableDrivers + 1;
        (Container.get('io') as any).of('/cms').emit('statChanged', { key: 'availableDrivers', value: 1});
        Container.get(Stats).inServiceDrivers = Container.get(Stats).inServiceDrivers - 1;
        (Container.get('io') as any).of('/cms').emit('statChanged', { key: 'inService', value: -1});
        if(request.confirmationCode != null) {
            if(object.confirmationCode == null) {
                callback(this.throwException(callback, new ConfirmationCodeRequired()));
                return;
            }
            if(object.confirmationCode != request.confirmationCode) {
                callback(this.throwException(callback, new ConfirmationCodeInvalid()));
                return;
            }
        }
        let paid = false;
        let costAfterCoupon = request.costBest;
        let cost = request.costBest;
        if(request.service.feeEstimationMode == FeeEstimationMode.Dynamic) {
            let duration = (new Date()).getTime() - request.startTimestamp;
            costAfterCoupon = request.service.calculateCost(object.distance, duration, 0)
            cost = costAfterCoupon
        }
        if (request.coupon != null) {
            costAfterCoupon *= 1 - (request.coupon.discountPercent / 100);
            costAfterCoupon -= request.coupon.discountFlat;
        }
        let wItem = request.rider.wallet.find(x=>x.currency == request.currency);
        if(costAfterCoupon <= request.paidAmount) {
            paid = true
        } else if (wItem != undefined && wItem.amount >= (costAfterCoupon - request.paidAmount)) {
            let commission = ((100 - request.service.providerSharePercent) * cost / 100) + request.service.providerShareFlat;
            let unPaidAmount = costAfterCoupon - request.paidAmount;
            await Promise.all([
                request.rider.addToWallet(-unPaidAmount, request.currency),
                request.driver.addToWallet(cost - commission, request.currency),
                RiderTransaction.insert({
                    rider: { id : request.rider.id },
                    amount: -unPaidAmount,
                    request: { id: request.id },
                    currency: request.currency,
                    transactionType: TransactionType.Travel,
                    documentNumber: request.id.toString()
                }),
                DriverTransaction.insert({
                    driver: { id : request.driver.id },
                    request: { id: request.id },
                    amount: cost,
                    transactionType:TransactionType.Travel,
                    documentNumber: request.id.toString(),
                    currency: request.currency
                }),
                DriverTransaction.insert({
                    driver: { id : request.driver.id },
                    request: { id: request.id },
                    amount: -commission,
                    transactionType: TransactionType.Commission,
                    documentNumber: request.id.toString(),
                    currency: request.currency
                }),
                Request.update(request.id, {
                    paidAmount: costAfterCoupon
                })
            ]);
            if(request.driver.fleet == null) {
                await AdminTransaction.insert({ 
                    amount: commission,
                    currency: request.currency,
                    transactionType: AdminTransactionType.Commission,
                    request: { id: request.id }
                });
                await AdminWallet.addToWallet(commission, request.currency);
            } else {
                let providerShare = commission * ( 100 - request.driver.fleet.commissionSharePercent) / 100;
                let fleetShare = commission * request.driver.fleet.commissionSharePercent / 100;
                await AdminTransaction.insert({ 
                    amount: providerShare,
                    currency: request.currency,
                    transactionType: AdminTransactionType.Commission,
                    request: { id: request.id }
                });
                await AdminWallet.addToWallet(providerShare, request.currency);
                await FleetTransaction.insert({
                    amount: fleetShare,
                    currency: request.currency,
                    transactionType: FleetTransactionType.Commission,
                    request: { id: request.id }
                })
                await request.driver.fleet.addToWallet(fleetShare, request.currency);
            }
            paid = true;
        }
        await Request.update(request.id, {
            status: paid ? (request.review == null ? RequestStatus.WaitingForReview : RequestStatus.Finished) : RequestStatus.WaitingForPostPay,
            finishTimestamp: new Date().getTime(),
            cost: cost,
            costAfterCoupon: costAfterCoupon,
            distanceReal: object.distance ?? 0,
            log: object.log
        });
        callback({status: paid});
        let riderConnectionId = Container.get('riders')[request.rider.id];
        if(riderConnectionId != null) {
            (Container.get('io') as any).of('/riders').to(riderConnectionId).emit('Finished', paid, costAfterCoupon - (wItem?.amount ?? 0));
        } else {
            if(paid) {
                Container.get(Notifier).rider.finished(request.rider);
            } else {
                Container.get(Notifier).rider.waitingForPostPay(request.rider);
            }
        }
    }

    async paidInCash(callback: (arg0?: SocketException) => void) {
        let request = await Request.findOne({ where: { driver: { id: this.socket.user.id } }, order: { id: 'DESC'}, relations: ['service', 'rider', 'driver', 'driver.fleet', 'review'] });
        if(request.service.paymentMethod == PaymentMethod.OnlyCredit) {
            callback(new UnknownException("Cash payment not allowed for this service"));
            return;
        }
        await Request.update(request.id, { 
            status: request.review == null ? RequestStatus.WaitingForReview : RequestStatus.Finished,
            finishTimestamp: new Date().getTime()
        });
        let providerShare = (request.cost * request.service.providerSharePercent / 100) + request.service.providerShareFlat;
        await DriverTransaction.insert({
            request: request,
            driver: {id : this.socket.user.id},
            transactionType: TransactionType.Commission,
            amount: -providerShare,
            currency: request.currency
        });
        await request.driver.addToWallet(-providerShare, request.currency);
        if(request.driver.fleet == null) {
            await AdminWallet.addToWallet(providerShare, request.currency);
            await AdminTransaction.insert({
                request: request,
                transactionType: AdminTransactionType.Commission,
                amount: providerShare,
                currency: request.currency
            });
        } else {
            await AdminWallet.addToWallet(providerShare * (1 - (request.driver.fleet.commissionSharePercent / 100)), request.currency);
            await AdminTransaction.insert({
                request: request,
                transactionType: AdminTransactionType.Commission,
                amount: providerShare * (1 - (request.driver.fleet.commissionSharePercent / 100)),
                currency: request.currency
            });
            await request.driver.fleet.addToWallet(providerShare * (request.driver.fleet.commissionSharePercent / 100), request.currency);
            await FleetTransaction.insert({
                request: request,
                fleet: request.driver.fleet,
                transactionType: FleetTransactionType.Commission,
                currency: request.currency,
                amount: providerShare * (request.driver.fleet.commissionSharePercent / 100)
            });
        }
        callback();
        let riderConnectionId = Container.get('riders')[request.rider.id];
        if(riderConnectionId != null) {
            (Container.get('io') as any).of('/riders').to(riderConnectionId).emit('Finished', true, 0);
        } else {
            Container.get(Notifier).rider.finished(request.rider);
        }
    }
}



export interface FinishTaxiDto {
    confirmationCode: number
    distance: number
    log: string
}