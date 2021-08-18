import { TopUpWalletDTO, CardInfo } from "../wallet-controller";
import { Driver } from "../../../entities/driver";
import { Rider } from "../../../entities/rider";
import IGateway from "./gateway.interface";
import rp from 'request-promise-any';
import * as xmlParser from "xml-js";

export default class PaygateGateway extends IGateway {
    async charge(dto: TopUpWalletDTO, user: Driver | Rider) {
        let publicKey = "10011072130";
        let privateKey = " test";
        let cardInfo: CardInfo = JSON.parse(dto.token);
        let text = `<?xml version="1.0" encoding="UTF-8"?><SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns1="http://www.paygate.co.za/PayHOST" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:SOAP-ENC="http://schemas.xmlsoap.org/soap/encoding/" SOAP-ENV:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"><SOAP-ENV:Body><ns1:SinglePaymentRequest>`
            + "    <ns1:CardPaymentRequest>"
            + "        <ns1:Account>"
            + `            <ns1:PayGateId>${this.gateway.publicKey}</ns1:PayGateId>`
            + `            <ns1:Password>${this.gateway.privateKey}</ns1:Password>`
            // + `            <ns1:PayGateId>${publicKey}</ns1:PayGateId>`
            // + `            <ns1:Password>${privateKey}</ns1:Password>`
            + "        </ns1:Account>"
            + "        <ns1:Customer>"
            + "            <ns1:Title>" + 'Mr' + "</ns1:Title>"
            + "            <ns1:FirstName>" + (user.firstName || 'Unknown') + "</ns1:FirstName>"
            + "            <ns1:LastName>" + (user.lastName || 'Unknown') + "</ns1:LastName>"
            + "            <ns1:Telephone>0" + user.mobileNumber + "</ns1:Telephone>"
            + "            <ns1:Mobile>0" + user.mobileNumber + "</ns1:Mobile>"
            + "            <ns1:Email>" + (user.email || 'something@gmail.com') + "</ns1:Email>"
            + "        </ns1:Customer>"
            + `        <ns1:CardNumber>${cardInfo.cardNumber}</ns1:CardNumber>`
            + `        <ns1:CardExpiryDate>${cardInfo.expiryMonth < 10 ? `0${cardInfo.expiryMonth}` : cardInfo.expiryMonth}${cardInfo.expiryYear.toString().length > 2 ? cardInfo.expiryYear : '20' + cardInfo.expiryYear.toString()}</ns1:CardExpiryDate>`
            + `        <ns1:CVV>${cardInfo.cvv}</ns1:CVV>`
            + "        <ns1:BudgetPeriod>0</ns1:BudgetPeriod>"
            + "        <ns1:Redirect>"
            + "            <ns1:NotifyUrl>" + 'https://www.mytestsite.com/notify' + "</ns1:NotifyUrl>"
            + "            <ns1:ReturnUrl>" + 'https://www.mytestsite.com/return' + "</ns1:ReturnUrl>"
            + "        </ns1:Redirect>"
            + "        <ns1:Order>"
            + "            <ns1:MerchantOrderId>" + "INV101" + "</ns1:MerchantOrderId>"
            + `            <ns1:Currency>${dto.currency}</ns1:Currency>`
            + `            <ns1:Amount>${dto.amount * 100}</ns1:Amount>`
            + "        </ns1:Order>"
            + "    </ns1:CardPaymentRequest>"
            + "</ns1:SinglePaymentRequest></SOAP-ENV:Body></SOAP-ENV:Envelope>";
        let result = await rp({
            method: 'POST',
            uri: 'https://secure.paygate.co.za/payhost/process.trans',
            headers: {
                'User-Agent': 'Request-Promise',
                'Content-Type': 'text/xml',
                'Accept': 'text/xml',
                'SOAPAction': 'SinglePayment'
            },
            body: text,
            json: false
        });
        let parsed = xmlParser.xml2js(result, { compact: true });
        let status = parsed['SOAP-ENV:Envelope']['SOAP-ENV:Body']['ns2:SinglePaymentResponse']['ns2:CardPaymentResponse']['ns2:Status']['ns2:TransactionStatusDescription']._text;
        if (status != 'Approved') {
            console.log(`Unknown Status for PayGate:${parsed['SOAP-ENV:Envelope']['SOAP-ENV:Body']['ns2:SinglePaymentResponse']['ns2:CardPaymentResponse']['ns2:Status']}`)
            throw Error(parsed['SOAP-ENV:Envelope']['SOAP-ENV:Body']['ns2:SinglePaymentResponse']['ns2:CardPaymentResponse']['ns2:Status']['ns2:ResultDescription']._text);
        }
        return parsed['SOAP-ENV:Envelope']['SOAP-ENV:Body']['ns2:SinglePaymentResponse']['ns2:CardPaymentResponse']['ns2:Status']['ns2:TransactionId']._text;
    }

    async chargeVault(vaultId,cvv,currency,amount, user: Driver | Rider) {
        let publicKey = "10011072130";
        let privateKey = " test";
        let text = `<?xml version="1.0" encoding="UTF-8"?><SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns1="http://www.paygate.co.za/PayHOST" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:SOAP-ENC="http://schemas.xmlsoap.org/soap/encoding/" SOAP-ENV:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"><SOAP-ENV:Body><ns1:SinglePaymentRequest>`
            + "    <ns1:CardPaymentRequest>"
            + "        <ns1:Account>"
            + `            <ns1:PayGateId>${this.gateway.publicKey}</ns1:PayGateId>`
            + `            <ns1:Password>${this.gateway.privateKey}</ns1:Password>`
            // + `            <ns1:PayGateId>${publicKey}</ns1:PayGateId>`
            // + `            <ns1:Password>${privateKey}</ns1:Password>`
            + "        </ns1:Account>"
            + "        <ns1:Customer>"
            + "            <ns1:Title>" + 'Mr' + "</ns1:Title>"
            + "            <ns1:FirstName>" + (user.firstName || 'Unknown') + "</ns1:FirstName>"
            + "            <ns1:LastName>" + (user.lastName || 'Unknown') + "</ns1:LastName>"
            + "            <ns1:Telephone>0" + user.mobileNumber + "</ns1:Telephone>"
            + "            <ns1:Mobile>0" + user.mobileNumber + "</ns1:Mobile>"
            // + "            <ns1:Email>" + (user.email || 'something@gmail.com') + "</ns1:Email>"
            + "            <ns1:Email>" + (user.address || 'something@gmail.com') + "</ns1:Email>"
            + "        </ns1:Customer>"            
            + `        <ns1:VaultId>${vaultId}</ns1:VaultId>`
            + `        <ns1:CVV>${cvv}</ns1:CVV>`
            + "        <ns1:BudgetPeriod>0</ns1:BudgetPeriod>"
            + "        <ns1:Redirect>"
            + "            <ns1:NotifyUrl>" + 'https://www.mytestsite.com/notify' + "</ns1:NotifyUrl>"
            + "            <ns1:ReturnUrl>" + 'https://www.mytestsite.com/return' + "</ns1:ReturnUrl>"
            + "        </ns1:Redirect>"
            + "        <ns1:Order>"
            + "            <ns1:MerchantOrderId>" + "INV101" + "</ns1:MerchantOrderId>"
            + `            <ns1:Currency>${currency}</ns1:Currency>`
            + `            <ns1:Amount>${amount * 100}</ns1:Amount>`
            + "        </ns1:Order>"
            + "    </ns1:CardPaymentRequest>"
            + "</ns1:SinglePaymentRequest></SOAP-ENV:Body></SOAP-ENV:Envelope>";
        let result = await rp({
            method: 'POST',
            uri: 'https://secure.paygate.co.za/payhost/process.trans',
            headers: {
                'User-Agent': 'Request-Promise',
                'Content-Type': 'text/xml',
                'Accept': 'text/xml',
                'SOAPAction': 'SinglePayment'
            },
            body: text,
            json: false
        });
        console.log(result);
        let parsed = xmlParser.xml2js(result, { compact: true });
        let status = parsed['SOAP-ENV:Envelope']['SOAP-ENV:Body']['ns2:SinglePaymentResponse']['ns2:CardPaymentResponse']['ns2:Status']['ns2:TransactionStatusDescription']._text;
        if (status != 'Approved') {
            console.log(`Unknown Status for PayGate:${parsed['SOAP-ENV:Envelope']['SOAP-ENV:Body']['ns2:SinglePaymentResponse']['ns2:CardPaymentResponse']['ns2:Status']}`)
            throw Error(parsed['SOAP-ENV:Envelope']['SOAP-ENV:Body']['ns2:SinglePaymentResponse']['ns2:CardPaymentResponse']['ns2:Status']['ns2:ResultDescription']._text);
        }
        return parsed['SOAP-ENV:Envelope']['SOAP-ENV:Body']['ns2:SinglePaymentResponse']['ns2:CardPaymentResponse']['ns2:Status']['ns2:TransactionId']._text;
    }



    async getCardDetail(user: Rider){
        let publicKey = "10011072130";
        let privateKey = " test";
        let text = `<?xml version="1.0" encoding="UTF-8"?><SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns1="http://www.paygate.co.za/PayHOST" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:SOAP-ENC="http://schemas.xmlsoap.org/soap/encoding/" SOAP-ENV:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"><SOAP-ENV:Body><ns1:SingleVaultRequest>`
            + "    <ns1:LookUpVaultRequest>"
            + "        <ns1:Account>"
            + `            <ns1:PayGateId>${this.gateway.publicKey}</ns1:PayGateId>`
            + `            <ns1:Password>${this.gateway.privateKey}</ns1:Password>`
            // + `            <ns1:PayGateId>${publicKey}</ns1:PayGateId>`
            // + `            <ns1:Password>${privateKey}</ns1:Password>`
            + "        </ns1:Account>"            
            + `        <ns1:VaultId>${user.vaultId}</ns1:VaultId>`
            + "    </ns1:LookUpVaultRequest>"
            + "</ns1:SingleVaultRequest></SOAP-ENV:Body></SOAP-ENV:Envelope>";
        let result = await rp({
            method: 'POST',
            uri: 'https://secure.paygate.co.za/payhost/process.trans',
            headers: {
                'User-Agent': 'Request-Promise',
                'Content-Type': 'text/xml',
                'Accept': 'text/xml',
                'SOAPAction': 'SinglePayment'
            },
            body: text,
            json: false
        });
        console.log(result);
        let parsed = xmlParser.xml2js(result, { compact: true });
        let status = parsed['SOAP-ENV:Envelope']['SOAP-ENV:Body']['ns2:SingleVaultResponse']['ns2:LookUpVaultResponse']['ns2:Status']['ns2:StatusName']._text;
        if (status != 'Completed') {
            console.log(`Unknown Status for PayGate:${parsed['SOAP-ENV:Envelope']['SOAP-ENV:Body']['ns2:SinglePaymentResponse']['ns2:CardPaymentResponse']['ns2:Status']}`)
            throw Error(parsed['SOAP-ENV:Envelope']['SOAP-ENV:Body']['ns2:SingleVaultResponse']['ns2:LookUpVaultResponse']['ns2:Status']['ns2:ResultDescription']._text);
        }
        let cardNumber = parsed['SOAP-ENV:Envelope']['SOAP-ENV:Body']['ns2:SingleVaultResponse']['ns2:LookUpVaultResponse']['ns2:Status']['ns2:PayVaultData'][0]['ns2:value']._text;
        let expireDate = parsed['SOAP-ENV:Envelope']['SOAP-ENV:Body']['ns2:SingleVaultResponse']['ns2:LookUpVaultResponse']['ns2:Status']['ns2:PayVaultData'][1]['ns2:value']._text;
        let results = [];
        results['cardNumber'] = cardNumber;
        results['expireDate'] = expireDate;
        console.log(results);
        return results;
    }
    async requestVaultId(token, user: Driver | Rider) {
        let publicKey = "10011072130";
        let privateKey = " test";
        let cardInfo: CardInfo = JSON.parse(token);
        console.log(cardInfo);
        let text = `<?xml version="1.0" encoding="UTF-8"?><SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns1="http://www.paygate.co.za/PayHOST" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:SOAP-ENC="http://schemas.xmlsoap.org/soap/encoding/" SOAP-ENV:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"><SOAP-ENV:Body><ns1:SingleVaultRequest>`
            + "    <ns1:CardVaultRequest>"
            + "        <ns1:Account>"
            + `            <ns1:PayGateId>${this.gateway.publicKey}</ns1:PayGateId>`
            + `            <ns1:Password>${this.gateway.privateKey}</ns1:Password>`
            // + `            <ns1:PayGateId>${publicKey}</ns1:PayGateId>`
            // + `            <ns1:Password>${privateKey}</ns1:Password>`
            + "        </ns1:Account>"            
            + `        <ns1:CardNumber>${cardInfo.cardNumber}</ns1:CardNumber>`
            + `        <ns1:CardExpiryDate>${(cardInfo.expiryMonth < 10 && !cardInfo.expiryMonth.toString().startsWith('0')) ? `0${cardInfo.expiryMonth}` : cardInfo.expiryMonth}${cardInfo.expiryYear.toString().length > 2 ? cardInfo.expiryYear : '20' + cardInfo.expiryYear.toString()}</ns1:CardExpiryDate>`
            + "    </ns1:CardVaultRequest>"
            + "</ns1:SingleVaultRequest></SOAP-ENV:Body></SOAP-ENV:Envelope>";
        let result = await rp({
            method: 'POST',
            uri: 'https://secure.paygate.co.za/payhost/process.trans',
            headers: {
                'User-Agent': 'Request-Promise',
                'Content-Type': 'text/xml',
                'Accept': 'text/xml',
                'SOAPAction': 'SinglePayment'
            },
            body: text,
            json: false
        });
        console.log(result);
        let parsed = xmlParser.xml2js(result, { compact: true });
        let status = parsed['SOAP-ENV:Envelope']['SOAP-ENV:Body']['ns2:SingleVaultResponse']['ns2:CardVaultResponse']['ns2:Status']['ns2:StatusName']._text;
        if (status != 'Completed') {
            let results = [];
            results['vaultId'] = "";
            results['cvv'] = cardInfo.cvv;
            console.log(results);
            return results;
        }
        let vaultId = parsed['SOAP-ENV:Envelope']['SOAP-ENV:Body']['ns2:SingleVaultResponse']['ns2:CardVaultResponse']['ns2:Status']['ns2:VaultId']._text;
        let results = [];
        results['vaultId'] = vaultId;
        results['cvv'] = cardInfo.cvv;
        console.log(results);
        return results;
    }


}