import IGateway from "./gateway.interface";
import { TopUpWalletDTO, CardInfo } from "../wallet-controller";
import { Driver } from "../../../entities/driver";
import { Rider } from "../../../entities/rider";
import { Razorpay } from 'razorpay'

export default class RazorpayGateway extends IGateway {
    async charge(dto: TopUpWalletDTO, user: Driver | Rider): Promise<string> {
        var instance = new Razorpay({
            key_id: this.gateway.publicKey,
            key_secret: this.gateway.privateKey,
          });
          let result = await instance.orders.create({
              amount: dto.amount,
              currency: dto.currency,
              receipt: 'null',
              payment_capture: true,
              notes: ''
          });
          return JSON.stringify(result);
    }
}