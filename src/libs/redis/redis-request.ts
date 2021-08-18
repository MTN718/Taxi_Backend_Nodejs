import Container from "typedi";
import CoordinateXY from '../../models/coordinatexy';

export default class RedisRequest {
    private redis: any;

    constructor() {
        this.redis = Container.get('redis');
    }

    async add(request: RequestInRedis, minutesfromNow: number) {
        let date = new Date()
        let expirationPoint = date.setMinutes(date.getMinutes() + minutesfromNow)
        await this.redis.geoaddAsync('request', request.points[0].x, request.points[0].y, request.id)
        await this.redis.zaddAsync('request-time', expirationPoint, request.id)
        await this.redis.setAsync('request:' + request.id, JSON.stringify(request))
    }

    async getForDriver(driverId: number): Promise<Array<RequestInRedis>> {
        let driverLocation = await this.redis.geoposAsync('driver', driverId);
        if(driverLocation[0] == null) {
            return [];
        }
        let requestIds = await this.redis.georadiusAsync('request', driverLocation[0][0], driverLocation[0][1], 100000, 'm');
        let requests = [];
        var ts = Math.round(new Date().getTime());
        var min = ts - (10 * 60000);
        var max = ts + (30 * 60000);
        let _requests = await this.redis.zrangebyscoreAsync('request-time', min, max);
        let intersection = requestIds.filter(x=>_requests.includes(x))
        for (let requestId of intersection) {
            let request = await this.redis.getAsync('request:' + requestId);
            if (request)
                requests.push(JSON.parse(request));
        }
        return requests;
    }

    async driverNotified(requestId: number, driverId: number) {
        return await this.redis.saddAsync(`request-drivers:${requestId}`, driverId)
    }

    async getDriversNotified(requestId: number): Promise<Array<number>> {
        let driverIds = await this.redis.smembersAsync(`request-drivers:${requestId}`);
        return driverIds.map((x: string) => parseInt(x));
    }

    async expire(requestId: number) {
        this.redis.zremAsync('request', requestId);
        this.redis.zremAsync('request-time', requestId);
        this.redis.expireAsync('request:' + requestId, -1);
    }

    async getAll(): Promise<RequestInRedis[]> {
        var min = 0;
        var max = -1;
        let _requests = await this.redis.zrangeAsync('request-time', min, max);
        let result: RequestInRedis[] = []
        for(let requestId of _requests) {
            let request = await this.redis.getAsync('request:' + requestId);
            result.push(JSON.parse(request))
        }
        return result;
    }
}

export class RequestInRedis {
    id: number
    requestTime: number
    expectedTime: number
    currency: string
    addresses: string[]
    points: CoordinateXY[]
    distanceBest: number
    durationBest: number
    costBest: number
    serviceId: number
}