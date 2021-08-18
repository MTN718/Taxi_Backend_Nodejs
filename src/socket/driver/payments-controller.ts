import SocketController from "../interfaces/socket.controller.interface";
import { PaymentRequest, PaymenRequestStatus } from "../../entities/payment-request";
import { Driver } from "../../entities/driver";
import UnknownException from "../exceptions/unknown.exception";
import { Request } from "../../entities/request";
import SocketException from "../exceptions/socket-exception";

export default class PaymentsController extends SocketController {
    constructor(socket: any) {
        super(socket);
        socket.on('GetStats', this.getStats.bind(this));
        socket.on('RequestPayment', this.requestPayment.bind(this));
        
    }

    async getStats(time: TimeQuery, callback: (arg0: StatisticsResult | SocketException) => void) {
        let q: Array<any> = await Request.query('SELECT currency, COUNT(currency) as count from request where driverId = ? group by currency order by count desc LIMIT 1',[this.socket.user.id]);
        if(q.length < 1) {
            callback({
                currency: 'USD',
                dataset: []
            });
            return;
        }
        let mostUsedCurrency: string = q[0].currency;
        let dataset: Datapoint[];
        let fields = 'SUM(cost) AS earning, COUNT(id) AS count, SUM(distanceBest) AS distance, SUM(durationBest) AS time'
        switch (time) {
            case TimeQuery.Daily:
                dataset = await Request.query(`SELECT CONCAT(ANY_VALUE(MONTH(requestTimestamp)),'/',ANY_VALUE(DAY(requestTimestamp))) as name, CONCAT(ANY_VALUE(MONTH(CURRENT_TIMESTAMP)),'/',ANY_VALUE(DAY(CURRENT_TIMESTAMP))) AS current, ${fields} from request WHERE DATEDIFF(NOW(),requestTimestamp) < 7 AND driverId = ? AND currency = ? GROUP BY DATE(requestTimestamp)`, [this.socket.user.id, mostUsedCurrency]);
                break;
            case TimeQuery.Weekly:
                dataset = await Request.query(`SELECT CONCAT(ANY_VALUE(YEAR(requestTimestamp)),',W',ANY_VALUE(WEEK(requestTimestamp))) AS name, CONCAT(ANY_VALUE(YEAR(CURRENT_TIMESTAMP)),',W',ANY_VALUE(WEEK(CURRENT_TIMESTAMP))) AS current, ${fields} FROM request WHERE driverId = ? AND currency = ? GROUP BY YEAR(requestTimestamp), WEEK(requestTimestamp)`, [this.socket.user.id, mostUsedCurrency]);
                break;

            case TimeQuery.Monthly:
                dataset = await Request.query(`SELECT CONCAT(ANY_VALUE(YEAR(requestTimestamp)),'/',ANY_VALUE(MONTH(requestTimestamp))) AS name, CONCAT(ANY_VALUE(YEAR(CURRENT_TIMESTAMP)),'/',ANY_VALUE(MONTH(CURRENT_TIMESTAMP))) AS current, ${fields} FROM request WHERE DATE(requestTimestamp) > DATE(MAKEDATE(year(now()),1)) AND driverId = ? AND currency = ? GROUP BY YEAR(requestTimestamp), MONTH(requestTimestamp)`, [this.socket.user.id, mostUsedCurrency]);
                break;
        }
        callback({
            currency: mostUsedCurrency,
            dataset: dataset
        });
    }

    async requestPayment(callback: (arg0?: SocketException) => void) {
        let [pending, driver] = await Promise.all([
            PaymentRequest.findOne({where: {status: PaymenRequestStatus.Pending, driver: { id: this.socket.user.id }}}),
            Driver.findOne(this.socket.user.id)
        ]);
        if (pending != undefined) {
            callback(new UnknownException('Pending Payment Found'));
            return;
        }
        await PaymentRequest.insert({driver: {id: this.socket.user.id}, accountNumber: driver.accountNumber});
        callback();
    }
}

enum TimeQuery {
    Daily = 'daily',
    Weekly = 'weekly',
    Monthly = 'monthly'
}

interface StatisticsResult {
    currency: string;
    dataset: Datapoint[];
}

interface Datapoint {
    name: string;
    current: string;
    earning: number;
    count: number;
    distance: number;
    time: number;
}