import SocketController from "../interfaces/socket.controller.interface";
import Container from "typedi";
import Redis from "../../libs/redis/redis";
import { DriverTransaction } from "../../entities/driver-transaction";
import { TransactionType } from "../../entities/rider-transaction";
import { DriverWallet } from "../../entities/driver-wallet";
import CMSException, { UnknownException } from "./exceptions/cms.exception";
import { Stats } from "../../models/stats";
import { AdminTransaction } from "../../entities/admin-transaction";
enum QueryTime {
    Day = 'day',
    Week = 'week',
    Month = 'month',
    Year = 'year',
}
interface IncomeResultItem {
    time: number;
    sum: number;
    currency: string;
}

interface RequestResultItem {
    time: number;
    count: number;
}

export default class DashboardController extends SocketController {

    constructor(socket: any) {
        super(socket);
        socket.on('getStats', this.getStats.bind(this));
        socket.on('getDriversLocation', this.getDriversLocation.bind(this));
        socket.on('insertPayment', this.insertPayment.bind(this));
        socket.on('incomeChart', this.getIncomeChart.bind(this));
        socket.on('requestsChart', this.getRequestsChart.bind(this));
    }

    async getStats(object: any, callback: (arg0: Stats) => void) {
        callback(Container.get(Stats));
    }

    async getIncomeChart(time: QueryTime, callback: (arg0: IncomeResultItem[]) => void) {
        let [grp, qry] = this.getQueryVars(time, 'transactionTime');
        let result = await AdminTransaction.query(`SELECT currency, SUM(amount) as sum, UNIX_TIMESTAMP(ANY_VALUE(transactionTime)) * 1000 AS time from admin_transaction WHERE ${qry} GROUP BY currency, ${grp}`);
        callback(result);
    }

    async getRequestsChart(time: QueryTime, callback: (arg0: RequestResultItem[]) => void) {
        let [grp, qry] = this.getQueryVars(time, 'requestTimestamp');
        let result = await AdminTransaction.query(`SELECT COUNT(id) as count, UNIX_TIMESTAMP(ANY_VALUE(requestTimestamp)) * 1000 AS time from request WHERE ${qry} GROUP BY ${grp}`)
        callback(result);
    }

    getQueryVars(query: QueryTime, timeField: string): [string, string] {
        switch (query) {
            case (QueryTime.Day):
                return [`DATE(${timeField}),TIME(${timeField})`, `DATE(${timeField}) = CURDATE()`];
            case (QueryTime.Month):
                return [`DAYOFYEAR(${timeField}),YEAR(${timeField})`,`DATE(${timeField}) > CURDATE() - INTERVAL 2 MONTH`];
            case (QueryTime.Week):
                return [`WEEKOFYEAR(${timeField}),YEAR(${timeField})`, `DATE(${timeField}) > CURDATE() - INTERVAL 6 MONTH`];
            case (QueryTime.Year):
                return [`MONTH(${timeField}),YEAR(${timeField})`, `DATE(${timeField}) > CURDATE() - INTERVAL 12 MONTH`];
        }
    }

    async getDriversLocation(arg: {}, callback: (arg0: CMSException | any[]) => void) {
        try {
            let result = await Container.get(Redis).driver.getAll();
            callback(result);
        }
        catch (err) {
            callback(new UnknownException(err.message));
            console.log(err.message);
        }
    }

    async insertPayment(info: PaymentInfo, callback) {
        let dWallet = await DriverWallet.find({ where: { driver: { id: info.driverId } } });
        if (dWallet.filter(x => x.currency == info.currency).length < 1) {
            callback(new UnknownException("Currency not found in wallet."));
            return
        }
        await DriverTransaction.insert({
            transactionType: TransactionType.TransferToBank,
            amount: info.amount,
            currency: info.currency,
            driver: { id: info.driverId },
            documentNumber: info.documentNumber,
            operator: { id: this.socket.user.id },
            details: info.details
        });
        await DriverWallet.update(dWallet[0].id, { amount: dWallet[0].amount - info.amount });
        callback()
    }
}

interface PaymentInfo {
    driverId: number,
    amount: number,
    currency: string,
    documentNumber: string,
    details: string
}