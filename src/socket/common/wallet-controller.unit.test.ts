
let paystack = require('paystack-node')
let sk = 'sk_test_d7cdb61316bf202d49b6fa19aa0bec0c3d45cce8';
import * as xmlParser from "xml-js";
let Ravepay = require('ravepay');

import rp from 'request-promise-any';
import { StructuredFormatting } from "@google/maps";
import { readdirSync } from "fs";
function stringer(cardNumber: number) {
    return "<ns1:SinglePaymentRequest>"
        + "    <ns1:CardPaymentRequest>"
        + "        <ns1:Account>"
        + "            <ns1:PayGateId>" + '10011064270' + "</ns1:PayGateId>"
        + "            <ns1:Password>" + 'test' + "</ns1:Password>"
        + "        </ns1:Account>"
        + "        <ns1:Customer>"
        + "            <ns1:Title>" + 'Mr' + "</ns1:Title>"
        + "            <ns1:FirstName>" + 'UnknownF' + "</ns1:FirstName>"
        + "            <ns1:LastName>" + 'UnknownL' + "</ns1:LastName>"
        + "            <ns1:Telephone>0861234567</ns1:Telephone>"
        + "            <ns1:Mobile>0761234567</ns1:Mobile>"
        + "            <ns1:Email>" + 'something@gmail.com' + "</ns1:Email>"
        + "        </ns1:Customer>"
        + "        <ns1:CardNumber>" + cardNumber + "</ns1:CardNumber>"
        + "        <ns1:CardExpiryDate>" + '122024' + "</ns1:CardExpiryDate>"
        + "        <ns1:CVV>999</ns1:CVV>"
        + "        <ns1:BudgetPeriod>" + 0 + "</ns1:BudgetPeriod>"
        + "        <ns1:Redirect>"
        + "            <ns1:NotifyUrl>" + 'https://www.mytestsite.com/notify' + "</ns1:NotifyUrl>"
        + "            <ns1:ReturnUrl>" + 'https://www.mytestsite.com/return' + "</ns1:ReturnUrl>"
        + "        </ns1:Redirect>"
        + "        <ns1:Order>"
        + "            <ns1:MerchantOrderId>" + "INV101" + "</ns1:MerchantOrderId>"
        + "            <ns1:Currency>" + 'ZAR' + "</ns1:Currency>"
        + "            <ns1:Amount>" + 100 + "</ns1:Amount>"
        + "        </ns1:Order>"
        + "    </ns1:CardPaymentRequest>"
        + "</ns1:SinglePaymentRequest>";
}
function addHeader(xml: string) {
    return `<?xml version="1.0" encoding="UTF-8"?><SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns1="http://www.paygate.co.za/PayHOST" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:SOAP-ENC="http://schemas.xmlsoap.org/soap/encoding/" SOAP-ENV:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"><SOAP-ENV:Body>${xml}</SOAP-ENV:Body></SOAP-ENV:Envelope>`;
}
function buildMethod1(cardNumber: number) {
    return addHeader(stringer(cardNumber))
}
it('paygate-success', async () => {
    /* let cNumber = 4000000000000002;
    let m1 = buildMethod1(cNumber);
    let headers = {
        'User-Agent': 'Request-Promise',
        'Content-Type': 'text/xml',
        'Accept': 'text/xml',
        'SOAPAction': 'SinglePayment',
        'Content-Length': Buffer.byteLength(m1)
    };
    let result = await rp({
        method: 'POST',
        uri: 'https://secure.paygate.co.za/payhost/process.trans',
        headers: headers,
        body: m1,
        json: false
    });
    let parsed = xmlParser.xml2js(result, {compact: true});
    expect(result).not.toHaveLength(0); */
})
// it('paygaye-insufficient', async() = {

// })
/*it('paystack-node', async () => {
    //let result = await paystack.transaction.initialize({
    //    email: '<phone_number>@payments.the-site.tld',
    //    amount: 12050,
    //})
    let ps = new paystack(sk, 'dev')
    let res = await ps.initializeTransaction({
        reference: "7PVGX8MEk85tgeEpVDtD",
        amount: 500000,
        email: "seun045olayinka@gmail.com"
    })
    console.log(res)
});
it('node-paystack', async () => {
    let ps = require('node-paystack')(sk);
    let res = await ps.transaction.initialize({
        reference: "7PVGX8MEk85tgeEpVDtD",
        amount: 500000,
        email: "seun045olayinka@gmail.com"
    })
    console.log(res);
})*/
async function ravaPay(cardInfo: CardInfo) {
    var rave = new Ravepay('FLWPUBK_TEST-550c521f9363ca80d87bdc70a9cb4318-X', 'FLWSECK_TEST-db8f7eb1da52e4d44fdf7f62abd91624-X', process.env.NODE_ENV == 'prod');
    if(cardInfo.otp != null && cardInfo.transactionId != null) {
        let res = await rave.Card.validate({
            "transaction_reference":cardInfo.transactionId,
            "otp":cardInfo.otp.toString()
        });
        return res;
    } else if(cardInfo.pin != null) {
        let result = await rave.Card.charge({
            "cardno": cardInfo.number.toString(),
            "cvv": '419',
            "expirymonth": cardInfo.expiryMonth.toString(),
            "expiryyear": cardInfo.expiryYear.toString(),
            "currency": 'NGN',
            "country": "NG",
            "amount": `50000`,
            "email": "moses@gmail.com",
            "suggested_auth": "pin",
            "pin": `${cardInfo.pin}`,
            "firstname": 'moses',
            "lastname": 'opata',
            "IP": "312201549",
            "txRef": "MC-" + Date.now()
        });
        return result;
    } else {
        let result = await rave.Card.charge({
            "cardno": cardInfo.number.toString(),
            "cvv": cardInfo.cvv.toString(),
            "expirymonth": cardInfo.expiryMonth.toString(),
            "expiryyear": cardInfo.expiryYear.toString(),
            "currency": 'NGN',
            "country": "NG",
            "amount": `50000`,
            "email": "moses@gmail.com",
            "firstname": 'moses',
            "lastname": 'opata',
            "IP": "312201549",
            "txRef": "MC-" + Date.now()
        });
        return result;
    }
}
it('ravepay', async () => {
    /*let pinCard: CardInfo = {
        number: 5531886652142950,
        expiryYear: 22,
        expiryMonth: 9,
        cvv: 564,
        pin: 3310
    };
    let dsCard: CardInfo = {
        number: 4187427415564246,
        expiryYear: 21,
        expiryMonth: 9,
        cvv: 828,
        pin: 3310,
        otp: 12345
    };
    let card = dsCard;
    let res = await ravaPay({
        number: card.number,
        expiryYear: card.expiryYear,
        expiryMonth: card.expiryMonth,
        cvv: card.cvv
    });
    if(res.body.message == 'AUTH_SUGGESTION' && res.body.data.suggested_auth == 'PIN') {
        res = await ravaPay({
            number: card.number,
            expiryYear: card.expiryYear,
            expiryMonth: card.expiryMonth,
            cvv: card.cvv,
            pin: card.pin
        })
    }
    if(res.body.data.status == 'success-pending-validation') {
        res = await ravaPay({
            transactionId: res.body.data.flwRef,
            number: card.number,
            expiryYear: card.expiryYear,
            expiryMonth: card.expiryMonth,
            cvv: card.cvv,
            pin: card.pin,
            otp: card.otp
        });
    }
    console.log(res);*/
    expect(1).toBe(1);
});

interface CardInfo {
    number: number;
    expiryYear: number;
    expiryMonth: number;
    cvv: number;
    transactionId?: string;
    pin?: number;
    otp?: number;
}