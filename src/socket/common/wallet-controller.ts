import SocketController from "../interfaces/socket.controller.interface";
import { DriverTransaction } from "../../entities/driver-transaction";
import { RiderTransaction, TransactionType } from "../../entities/rider-transaction";
import UnknownException from "../exceptions/unknown.exception";
import { PaymentGateway, PaymentGatewayType } from "../../entities/payment-gateway";
import * as brain from "braintree";
import { DriverToGateway } from "../../entities/driver-to-gateway";
import { Driver } from "../../entities/driver";
import { Rider } from "../../entities/rider";
import { RiderToGateway } from "../../entities/rider-to-gateway";
import { Request, RequestStatus } from "../../entities/request";
import { RiderWallet } from "../../entities/rider-wallet";
import Container from "typedi";
import Notifier from "../../libs/notifier/notifier";
import { ClientType } from "../../models/client-jwt-decoded";
import { DriverWallet } from "../../entities/driver-wallet";
import FlutterwaveGateway from "./gateways/flutterwave.gateway";
import BraintreeGateway from "./gateways/braintree.gateway";
import PaygateGateway from "./gateways/paygate.gateway";
import StripeGateway from './gateways/stripe.gateway'
import IGateway from "./gateways/gateway.interface";
import SocketException from "../exceptions/socket-exception";
import RazorpayGateway from "./gateways/razorpay.gateway";
import { AdminTransaction, AdminTransactionType } from "../../entities/admin-transaction";
import { AdminWallet } from "../../entities/admin-wallet";
import { FleetTransaction, FleetTransactionType } from "../../entities/fleet-transaction";
import { Fleet } from "../../entities/fleet";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";

export default class WalletController extends SocketController {
    constructor(socket: any) {
        super(socket)
        socket.on('WalletTopUp', this.chargeAccount.bind(this));
        socket.on('WalletInfo', this.walletInfo.bind(this));
        socket.on('VaultInfo',this.vaultInfo.bind(this));
        socket.on('PayVault',this.payVault.bind(this));
        socket.on('GetWallet',this.getWalletInfo.bind(this));
        
    }

    

    async payVault(params,callback: () => void){
        console.log(params);
        let result = await PaymentGateway.find({ where: { enabled: true } });
        let user: Rider | Driver;
        let vId = '';
        if (this.socket.user.t == ClientType.Driver) {
            user = await Driver.findOne(this.socket.user.id, { relations: ['gatewayIds', 'gatewayIds.gateway']});
        } else {
            user = await Rider.findOne(this.socket.user.id, { relations: ['gatewayIds', 'gatewayIds.gateway']});

            var gw = new PaygateGateway(result[0]);
            console.log(user);
            let token = await gw.chargeVault(user.vaultId,user.cvc,params.currency,params.cost, user);
            console.log(token);

            let rider = await Rider.findOne({ where: { id: this.socket.user.id }, relations: ['wallet'] });
            let request = await Request.findOne({ where: { rider: { id: this.socket.user.id } }, order: { id: 'DESC' }, relations: ['rider', 'rider.wallet', 'driver', 'driver.fleet', 'service'] });
            let wItem = await rider.addToWallet(params.cost, params.currency);
            await RiderTransaction.insert({
                rider: { id: this.socket.user.id },
                amount: params.cost,
                request: request,
                paymentGateway: result[0],
                currency: params.currency,
                transactionType: TransactionType.InApp,
                documentNumber: token
            });
            if (request != null && request.status == RequestStatus.WaitingForPostPay && wItem.amount >= (request.costAfterCoupon - request.paidAmount)) {
                let commission = ((request.service.providerSharePercent) * request.cost / 100) + request.service.providerShareFlat;
                let unpaidAmount = request.costAfterCoupon - request.paidAmount;
                await Promise.all([
                    request.rider.addToWallet(-unpaidAmount, request.currency),
                    request.driver.addToWallet(request.cost - commission, request.currency),
                    RiderTransaction.insert({
                        rider: { id: request.rider.id },
                        amount: -unpaidAmount,
                        request: { id: request.id },
                        currency: request.currency,
                        transactionType: TransactionType.Travel,
                        documentNumber: request.id.toString()
                    }),
                    DriverTransaction.insert({
                        driver: { id: request.driver.id },
                        request: { id: request.id },
                        amount: request.cost,
                        transactionType: TransactionType.Travel,
                        documentNumber: request.id.toString(),
                        currency: request.currency
                    }),
                    DriverTransaction.insert({
                        driver: { id: request.driver.id },
                        request: { id: request.id },
                        amount: -commission,
                        transactionType: TransactionType.Commission,
                        documentNumber: request.id.toString(),
                        currency: request.currency
                    }),
                    Request.update(request.id, {
                        paidAmount: request.costAfterCoupon
                    })
                ]);
                if(request.driver.fleet == null) {
                    await AdminTransaction.insert({ 
                        amount: commission,
                        currency: request.currency,
                        transactionType: AdminTransactionType.Commission,
                        request: { id: request.id },
                        paymentGateway: result[0]
                    });
                    await AdminWallet.addToWallet(commission, request.currency);
                } else {
                    let providerShare = commission * ( 100 - request.driver.fleet.commissionSharePercent) / 100;
                    let fleetShare = commission * request.driver.fleet.commissionSharePercent / 100;
                    await AdminTransaction.insert({ 
                        amount: providerShare,
                        currency: request.currency,
                        transactionType: AdminTransactionType.Commission,
                        request: { id: request.id },
                        paymentGateway: result[0]
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
                let connectionId = Container.get('drivers')[request.driver.id];
                if (connectionId != null) {
                    (Container.get('io') as any).of('/drivers').to(connectionId).emit('paid');
                } else {
                    Container.get(Notifier).driver.paid(request.driver);
                }
                await Request.update(request.id, { status: request.rating == null ? RequestStatus.WaitingForReview : RequestStatus.Finished, finishTimestamp: new Date().getTime() });
            }
        }
        callback();      
    }

    async getWalletInfo(params,callback)
    {
        console.log(params);
        console.log(callback);
        let result = await PaymentGateway.find({ where: { enabled: true } });
        let user: Rider | Driver;
        let vId = '';
        user = await Rider.findOne(this.socket.user.id, { relations: ['gatewayIds', 'gatewayIds.gateway']});
        var gw = new PaygateGateway(result[0]);
        let vaultInfo = await gw.getCardDetail(user);
        callback({
            cardnumber: vaultInfo['cardNumber'],
            expire_date: vaultInfo['expireDate'],
        });
    }

    async vaultInfo(params,callback: (arg0) => void){
        console.log(params);
        let result = await PaymentGateway.find({ where: { enabled: true } });
        let user: Rider | Driver;
        let vId = '';
        if (this.socket.user.t == ClientType.Driver) {
            user = await Driver.findOne(this.socket.user.id, { relations: ['gatewayIds', 'gatewayIds.gateway']});
        } else {
            user = await Rider.findOne(this.socket.user.id, { relations: ['gatewayIds', 'gatewayIds.gateway']});

            var gw = new PaygateGateway(result[0]);
            let vaultInfo = await gw.requestVaultId(params.token, user);

            let _user: QueryDeepPartialEntity<Rider> = {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                gender: user.gender,
                address: user.address,
                vaultId:vaultInfo['vaultId'],
                cvc:vaultInfo['cvv']
            }
            Rider.update(this.socket.user.id, _user)
            vId = vaultInfo['vaultId'];
        }
        callback({
            vId: vId,
        });
       
    }

    async walletInfo(callback: (arg0: WalletInfo) => void) {
        let result = await PaymentGateway.find({ where: { enabled: true } });
        let user: Rider | Driver;
        type GtId = DriverToGateway | RiderToGateway;
        if (this.socket.user.t == ClientType.Driver) {
            user = await Driver.findOne(this.socket.user.id, { relations: ['gatewayIds', 'gatewayIds.gateway']});
        } else {
            user = await Rider.findOne(this.socket.user.id, { relations: ['gatewayIds', 'gatewayIds.gateway']});
        }
        let braintrees = result.filter(x => { return x.type == PaymentGatewayType.BrainTree });
        for (let bt of braintrees) {
            let braintree = new brain.BraintreeGateway({
                environment: process.env.DEMO_MODE != undefined ? brain.Environment.Sandbox : brain.Environment.Production,
                merchantId: bt.merchantId,
                publicKey: bt.publicKey,
                privateKey: bt.privateKey
            });
            let cId = (user.gatewayIds as GtId[]).find(x => x.gateway.id == bt.id);
            let id = '';
            if (cId == undefined) {
                let customer = await braintree.customer.create({
                    firstName: user.firstName,
                    lastName: user.lastName,
                    phone: user.mobileNumber.toString()
                });
                id = customer.customer.id;
                if (this.socket.user.t == ClientType.Driver) {
                    const driver: Driver = { id: user.id } as Driver;
                    let r = { driver, gateway: bt, customerId: customer.customer.id } as DriverToGateway;
                    await DriverToGateway.save(r);
                } else {
                    const rider: Rider = { id: user.id } as Rider;
                    let r = { rider, gateway: bt, customerId: customer.customer.id } as RiderToGateway;
                    await RiderToGateway.save(r);
                }
            } else {
                id = cId.customerId;
            }
            let token = await braintree.clientToken.generate({
                customerId: id
            });
            bt.publicKey = token.clientToken;
        }
        let wallet = this.socket.user.t == ClientType.Driver ? await DriverWallet.find({ where: { driver: { id: this.socket.user.id } } }) : await RiderWallet.find({ where: { rider: { id: this.socket.user.id } } })
        callback({
            gateways: result,
            wallet: wallet
        });
    }

    async chargeAccount(dto: TopUpWalletDTO, callback: (arg0?: SocketException) => void) {
        try {
            let gateway = await PaymentGateway.findOne(dto.gatewayId);
            let user = this.socket.user.t == ClientType.Driver ? await Driver.findOne(this.socket.user.id) : await Rider.findOne(this.socket.user.id);
            var gw: IGateway;
            switch (gateway.type) {
                case (PaymentGatewayType.Stripe): {
                    gw = new StripeGateway(gateway);
                    break;
                }
                case (PaymentGatewayType.BrainTree): {
                    gw = new BraintreeGateway(gateway);
                    break;
                }
                case (PaymentGatewayType.Flutterwave): {
                    gw = new FlutterwaveGateway(gateway);
                    break;
                }
                case (PaymentGatewayType.PayGate): {
                    gw = new PaygateGateway(gateway);
                    break;
                }
                case (PaymentGatewayType.Razorpay): {
                    gw = new RazorpayGateway(gateway);
                }

            }
            let token = await gw.charge(dto, user);
            if (this.socket.user.t == ClientType.Driver) {
                DriverTransaction.insert({
                    driver: { id: this.socket.user.id },
                    amount: dto.amount,
                    transactionType: TransactionType.InApp,
                    paymentGateway: gateway,
                    documentNumber: token,
                    currency: dto.currency
                })
                let driver = await Driver.findOne({ where: { id: this.socket.user.id }, relations: ['wallet'] });
                await driver.addToWallet(dto.amount, dto.currency);
            } else {
                let rider = await Rider.findOne({ where: { id: this.socket.user.id }, relations: ['wallet'] });
                let request = await Request.findOne({ where: { rider: { id: this.socket.user.id } }, order: { id: 'DESC' }, relations: ['rider', 'rider.wallet', 'driver', 'driver.fleet', 'service'] });
                let wItem = await rider.addToWallet(dto.amount, dto.currency);
                await RiderTransaction.insert({
                    rider: { id: this.socket.user.id },
                    amount: dto.amount,
                    request: request,
                    paymentGateway: gateway,
                    currency: dto.currency,
                    transactionType: TransactionType.InApp,
                    documentNumber: token
                });
                if (request != null && request.status == RequestStatus.WaitingForPostPay && wItem.amount >= (request.costAfterCoupon - request.paidAmount)) {
                    let commission = ((request.service.providerSharePercent) * request.cost / 100) + request.service.providerShareFlat;
                    let unpaidAmount = request.costAfterCoupon - request.paidAmount;
                    await Promise.all([
                        request.rider.addToWallet(-unpaidAmount, request.currency),
                        request.driver.addToWallet(request.cost - commission, request.currency),
                        RiderTransaction.insert({
                            rider: { id: request.rider.id },
                            amount: -unpaidAmount,
                            request: { id: request.id },
                            currency: request.currency,
                            transactionType: TransactionType.Travel,
                            documentNumber: request.id.toString()
                        }),
                        DriverTransaction.insert({
                            driver: { id: request.driver.id },
                            request: { id: request.id },
                            amount: request.cost,
                            transactionType: TransactionType.Travel,
                            documentNumber: request.id.toString(),
                            currency: request.currency
                        }),
                        DriverTransaction.insert({
                            driver: { id: request.driver.id },
                            request: { id: request.id },
                            amount: -commission,
                            transactionType: TransactionType.Commission,
                            documentNumber: request.id.toString(),
                            currency: request.currency
                        }),
                        Request.update(request.id, {
                            paidAmount: request.costAfterCoupon
                        })
                    ]);
                    if(request.driver.fleet == null) {
                        await AdminTransaction.insert({ 
                            amount: commission,
                            currency: request.currency,
                            transactionType: AdminTransactionType.Commission,
                            request: { id: request.id },
                            paymentGateway: gateway
                        });
                        await AdminWallet.addToWallet(commission, request.currency);
                    } else {
                        let providerShare = commission * ( 100 - request.driver.fleet.commissionSharePercent) / 100;
                        let fleetShare = commission * request.driver.fleet.commissionSharePercent / 100;
                        await AdminTransaction.insert({ 
                            amount: providerShare,
                            currency: request.currency,
                            transactionType: AdminTransactionType.Commission,
                            request: { id: request.id },
                            paymentGateway: gateway
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
                    let connectionId = Container.get('drivers')[request.driver.id];
                    if (connectionId != null) {
                        (Container.get('io') as any).of('/drivers').to(connectionId).emit('paid');
                    } else {
                        Container.get(Notifier).driver.paid(request.driver);
                    }
                    await Request.update(request.id, { status: request.rating == null ? RequestStatus.WaitingForReview : RequestStatus.Finished, finishTimestamp: new Date().getTime() });
                }
            }
            callback();
        } catch (error) {
            console.log(error.message);
            if(error.status != null) {
                callback(error);
            } else {
                callback(new UnknownException(error.message));
            }
        }
    }
}

export interface CardInfo {
    cardNumber: string;
    cvv: string;
    expiryYear: number;
    expiryMonth: number;
}

interface WalletInfo {
    gateways: PaymentGateway[]
    wallet: WalletItem[]
}

interface VaultInfo {
    gateways: PaymentGateway[]
    wallet: WalletItem[]
}

interface WalletItem {
    amount: number;
    currency: string;
}

export interface TopUpWalletDTO {
    gatewayId: number;
    amount: number;
    currency: string;
    token: string;
    pin?: number;
    otp?: number;
    transactionId?: string;
}