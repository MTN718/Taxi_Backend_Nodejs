import { TopUpWalletDTO, CardInfo } from "../wallet-controller";
import { Driver } from "../../../entities/driver";
import { Rider } from "../../../entities/rider";
import { PaymentGateway } from "../../../entities/payment-gateway";
import IGateway from "./gateway.interface";
import * as gw from 'braintree';

export default class BraintreeGateway extends IGateway {
    async charge(dto: TopUpWalletDTO, user: Driver | Rider) {
        let braintree = new gw.BraintreeGateway({
            environment: process.env.DEMO_MODE != undefined ? gw.Environment.Sandbox : gw.Environment.Production,
            merchantId: this.gateway.merchantId,
            publicKey: this.gateway.publicKey,
            privateKey: this.gateway.privateKey
        });
        let res = await braintree.transaction.sale({
            amount: dto.amount.toString(),
            paymentMethodNonce: dto.token,
            options: {
                submitForSettlement: true
            }
        });
        return res.transaction.id;
    }
}