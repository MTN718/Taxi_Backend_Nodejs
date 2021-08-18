import { TopUpWalletDTO } from "../wallet-controller";
import { Driver } from "../../../entities/driver";
import { Rider } from "../../../entities/rider";
import { PaymentGateway } from "../../../entities/payment-gateway";

export default abstract class IGateway {
    gateway: PaymentGateway;
    constructor(gateway: PaymentGateway) {
        this.gateway = gateway;
    }

    abstract charge(dto: TopUpWalletDTO, user: Driver | Rider): Promise<string>
}