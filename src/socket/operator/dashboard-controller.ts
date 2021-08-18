import SocketController from "../interfaces/socket.controller.interface";
import { DriverLocation } from "../../models/driver-location";
import { Driver } from "../../entities/driver";
import { Rider } from "../../entities/rider";
import { Request } from "../../entities/request";
import { Complaint } from "../../entities/complaint";
import Container from "typedi";
import Redis from "../../libs/redis/redis";
import { DriverTransaction } from "../../entities/driver-transaction";
import { TransactionType } from "../../entities/rider-transaction";
import { DriverWallet } from "../../entities/driver-wallet";

export default class DashboardController extends SocketController {
    
    constructor(socket: any) {
        super(socket)
        socket.on('getStats', this.getStats.bind(this))
        socket.on('getDriversLocation', this.getDriversLocation.bind(this))
        socket.on('insertPayment', this.insertPayment.bind(this))
    }

    async getStats(callback: (arg0: StatsObject) => void) {
        let [drivers, riders, travels, waitings] = await Promise.all([
            Driver.count(),
            Rider.count(),
            Request.count(),
            Complaint.count({ where: { isReviewed: false } })
        ])
        let result: StatsObject = {
            drivers:drivers,
            riders: riders,
            travels: travels,
            complaints_waiting: waitings
        }
        callback(result);
    }

    async getDriversLocation(callback) {
        try {
            let result = await Container.get(Redis).driver.getAll();
            callback(200, result);
        }
        catch (err) {
            console.log(err.message);
        }
    }

    async insertPayment(info: PaymentInfo, callback) {
        let dWallet = await DriverWallet.find({where: {driver: {id: info.driverId}}});
        if(dWallet.filter(x=>x.currency == info.currency).length < 1) {
            callback(404)
            return
        }
        await DriverTransaction.insert({
            transactionType: TransactionType.TransferToBank,
            amount: info.amount,
            currency: info.currency,
            driver: { id: info.driverId },
            documentNumber: info.documentNumber,
            operator: {id: this.socket.user.id},
            details: info.details
        });
        await DriverWallet.update(dWallet[0].id, {amount: dWallet[0].amount - info.amount});
        callback(200)
    }
}

export interface StatsObject {
    drivers: number;
    riders: number;
    travels: number;
    complaints_waiting: number;
}

interface PaymentInfo {
    driverId: number,
    amount: number,
    currency: string,
    documentNumber: string,
    details: string
}