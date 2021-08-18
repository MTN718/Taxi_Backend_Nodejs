import { TopUpWalletDTO, CardInfo } from "../wallet-controller";
import { Driver } from "../../../entities/driver";
import { Rider } from "../../../entities/rider";
import { PaymentGateway } from "../../../entities/payment-gateway";
import IGateway from "./gateway.interface";
const Ravepay = require('flutterwave-node');
import PINCodeRequired from "../../exceptions/pin-code-required";
import OTPCodeRequired from "../../exceptions/otp-code-required";
import UnknownException from "../../../express/exceptions/unknown.exception";

export default class FlutterwaveGateway extends IGateway {
    async charge(dto: TopUpWalletDTO, user: Driver | Rider) {
        let cardInfo: CardInfo = JSON.parse(dto.token);
        var rave = new Ravepay(this.gateway.publicKey, this.gateway.privateKey, process.env.NODE_ENV != 'dev');
        let result;
        if (dto.otp != null && dto.transactionId != null) {
            result = await rave.Card.validate({
                "transaction_reference": dto.transactionId,
                "otp": dto.otp.toString()
            });
        } else if (dto.pin != null) {
            result = await rave.Card.charge({
                "cardno": cardInfo.cardNumber.toString(),
                "cvv": cardInfo.cvv.toString(),
                "expirymonth": cardInfo.expiryMonth.toString(),
                "expiryyear": cardInfo.expiryYear.toString().length > 2 ? cardInfo.expiryYear.toString().substring(2) : cardInfo.expiryYear.toString(),
                "currency": dto.currency,
                "country": "NG",
                "amount": `${parseInt(dto.amount.toString())}`,
                "email": "moses@gmail.com",
                "firstname": user.firstName ?? 'Unknown',
                "lastname": user.lastName ?? 'Unknown',
                "IP": "312201549",
                "txRef": "MC-" + Date.now(),
                "suggested_auth": "pin",
                "pin": `${dto.pin}`
            });
        } else {
            result = await rave.Card.charge({
                "cardno": cardInfo.cardNumber.toString(),
                "cvv": cardInfo.cvv.toString(),
                "expirymonth": cardInfo.expiryMonth.toString(),
                "expiryyear": cardInfo.expiryYear.toString().length > 2 ? cardInfo.expiryYear.toString().substring(2) : cardInfo.expiryYear.toString(),
                "currency": dto.currency,
                "country": "NG",
                "amount": `${parseInt(dto.amount.toString())}`,
                "email": "moses@gmail.com",
                "firstname": user.firstName ?? 'Unknown',
                "lastname": user.lastName ?? 'Unknown',
                "IP": "312201549",
                "txRef": "MC-" + Date.now()
            });
        }
        if(result.body.message == 'AUTH_SUGGESTION' || result.body.message == 'Incorrect PIN') {
            throw new PINCodeRequired();
        }
        if(result.body.data.status == 'success-pending-validation') {
            throw new OTPCodeRequired(result.body.data.flwRef);
        }
        if(result.body.status != 'error' && (result.body.message == 'Charge Complete' || result.body.message == 'V-COMP')) {
            return result.body.data.flwRef;
        } else {
            throw new UnknownException(result.body.message);
        }
    }
}