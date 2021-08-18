import redisObject from 'redis';
import { Promise as  pr } from 'bluebird';
import Notifier from '../notifier/notifier';
import { RedisSettings } from "../../models/settings";
import RedisDriver from './redis-driver'
import RedisRequest from './redis-request'
import Container, { Service } from "typedi";
import { Driver, DriverStatus } from '../../entities/driver';
import { Request, RequestStatus } from '../../entities/request';
import { Stats } from '../../models/stats';
import { In } from 'typeorm';

@Service()
export default class Redis {
    public driver: RedisDriver;
    public request: RedisRequest;

    constructor(settings: RedisSettings) {
        Container.set('redis', pr.Promise.promisifyAll(redisObject.createClient({
            host: process.env.NODE_ENV == 'docker' ? 'redis' : 'localhost'
        })));
        this.driver = new RedisDriver();
        this.request = new RedisRequest();
        setInterval(this.timedTask.bind(this), 300000);
    }

    async timedTask() {
        let redis = Container.get('redis') as any;
        var ts = Math.round(new Date().getTime());
        // Driver Locations Expire Time If Not Updated, 60 Minutes By Default
        var tsDriverMaxTime = ts - (60 * 60000);
        // Requests Expire Time, 10 Minutes By Default
        var tsRequestMaxTime = ts - (10 * 60000);
        let expiredDrivers: number[] = await redis.zrangebyscoreAsync('driver-location-time', 0, tsDriverMaxTime);
        let expiredRequests = await redis.zrangebyscoreAsync('request-time', 0, tsRequestMaxTime);
        if(expiredDrivers.length > 0) {
            let drivers = await Driver.find({where: {id: In(expiredDrivers)}});
            for (let _driver of drivers) {
                if(_driver.status != DriverStatus.InService) {
                    await this.driver.expire(_driver.id);
                    await Driver.update(_driver.id, { status: DriverStatus.Offline, lastSeenTimestamp: new Date().getTime() });
                }
            }
            let count = await Driver.count({where: {status: DriverStatus.Online}});
            (Container.get('io') as any).of('/cms').emit('statChanged', { key: 'availableDrivers', value: (count - Container.get(Stats).availableDrivers)});
            Container.get(Stats).availableDrivers = count;
        }
        if(expiredRequests.length > 0) {
            for (let _request of expiredRequests) {
                this.request.expire(_request);
            }
            await Request.update(expiredRequests, { status: RequestStatus.Expired });
        }
        var waitingMinTime = ts - (10 * 60000);
        var waitingMaxTime = ts + (30 * 60000);
        let waitingRequests = await redis.zrangebyscoreAsync('request-time', waitingMinTime, waitingMaxTime)
        for (let waitingRequest of waitingRequests) {
            let driversNotified = await this.request.getDriversNotified(waitingRequest);
            let requestLocation = await redis.geoposAsync('request', waitingRequest);
            let closeDrivers = await this.driver.getClose({y: requestLocation[0][1], x: requestLocation[0][0]},10000);
            closeDrivers = closeDrivers.filter(x => {
                return !(driversNotified.includes(x.driverId));
            })
            if(closeDrivers.length > 0) {
                let driverIds = closeDrivers.map(x=>x.driverId);
                let drivers = await Driver.findByIds(driverIds);
                let request = await redis.getAsync(`request:${waitingRequest}`);
                Container.get(Notifier).driver.requests(drivers, request);
            }
        }
    }
}