import { TopUpWalletDTO } from "../wallet-controller";
import { Driver } from "../../../entities/driver";
import { Rider } from "../../../entities/rider";
import IGateway from "./gateway.interface";
import Stripe from "stripe";

export default class StripeGateway extends IGateway {
    async charge(dto: TopUpWalletDTO, user: Driver | Rider) {
        let stripe = new Stripe(this.gateway.privateKey, {
            apiVersion: null
        });
        let intent = await stripe.paymentIntents.retrieve(dto.token);
        /*let res = await stripe.charges.create({
            amount: Math.floor(amount),
            currency: dto.currency.toLowerCase(),
            source: dto.token
        })*/
        if(intent.status == 'succeeded') {
            return intent.id;
        } else {
            throw new Error(intent.status);
        }
    }
}