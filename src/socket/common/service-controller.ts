import { UserType } from "../../models/enums/enums";
import { ServiceRequestDto } from '../../models/dto/service-request.dto'
import SocketController from "../interfaces/socket.controller.interface";
import { DriverLocationWithId } from "../../models/driver-location";
import DriversUnavailableException from '../exceptions/drivers-unavailable.exception'
import { Request, RequestStatus } from "../../entities/request";
import { Driver, DriverStatus } from "../../entities/driver";
import UnknownException from "../exceptions/unknown.exception";
import { In } from "typeorm";
import Container from "typedi";
import Redis from "../../libs/redis/redis";
import Notifier from "../../libs/notifier/notifier";
import GeoLib from "../../libs/geo";
import { Service, DistanceFee } from "../../entities/service";
import { Region } from "../../entities/region";
import SocketException from "../exceptions/socket-exception";
import DestinationTooFarException from "../exceptions/destination-too-far.exception";

export default class ServiceController extends SocketController {

    constructor(socket: any, userType: UserType) {
        super(socket, userType)
        socket.on('RequestService', this.requestService.bind(this))
        socket.on('CancelRequest', this.cancelRequest.bind(this))
    }

    async requestService(requestDto: ServiceRequestDto, callback: (arg0?: SocketException) => void) {
        try {
            console.log(requestDto);
            let service = await Service.findOne(requestDto.services[0].serviceId);
            let driverIds = [];
            if (!requestDto.driverId)
            {
                let closeDrivers = await Container.get(Redis).driver.getClose(requestDto.locations[0].loc, service.searchRadius);
                if (closeDrivers.length < 1) {
                    callback(new DriversUnavailableException());
                    return;
                }
                driverIds = closeDrivers.map((x: DriverLocationWithId) => x.driverId);
            }
            else
            {
                driverIds = [requestDto.driverId];
            }
            console.log(driverIds);
            let driversWithService = await Driver.find({where: {
                    id: In(driverIds),
                    status: DriverStatus.Online
                }, relations: ['services']});
            driversWithService = driversWithService.filter(x => {
                return x.services.map(y=>y.id).includes(requestDto.services[0].serviceId)
            });
            if (driversWithService.length < 1) {
                callback(new DriversUnavailableException());
                return;
            }
            let distance = 0;
            let duration = 0;
            if(service.distanceFeeMode == DistanceFee.PickupToDestination) {
                let metrics = await Container.get(GeoLib).calculateDistance(requestDto.locations.map(x=>x.loc));
                distance = metrics.json.rows[0].elements.reduce((a, b) => {return a + b.distance.value}, 0);
                duration = metrics.json.rows[0].elements.reduce((a, b) => {return a + b.duration.value}, 0);
            }
            let cost = (await Service.findOne(requestDto.services[0].serviceId)).calculateCost(distance, duration, 1);
            let eta = new Date();
            eta.setMinutes(new Date().getMinutes() + (requestDto.intervalMinutes | 0));
            let etaPickup = eta.getTime();
            let regions: Region[] = await Region.query("SELECT * FROM region WHERE enabled=TRUE AND ST_Within(st_geomfromtext('POINT(? ?)'), region.location)", [requestDto.locations[0].loc.x, requestDto.locations[0].loc.y]);
            if(service.maxDestinationDistance != 0 && distance > service.maxDestinationDistance) {
                callback(new DestinationTooFarException());
                return;
            }
            let request = {
                service: {id: requestDto.services[0].serviceId},
                currency: regions[0].currency,
                rider: { id: this.userType == UserType.Admin ? requestDto.riderId : this.socket.user.id },
                points: requestDto.locations.map(x=>x.loc),
                addresses: requestDto.locations.map(x=>x.add),
                distanceBest: distance ?? 0,
                durationBest: duration ?? 0,
                costBest: cost,
                costAfterCoupon: cost,
                etaPickup: etaPickup,
                operator: this.userType == UserType.Admin ? { id: this.socket.user.id } : null
            }
            request['id'] = (await Request.insert(request)).raw.insertId;
            let requestInRedis = {
                id: request['id'] as number,
                requestTime: new Date().getTime(),
                currency: regions[0].currency,
                expectedTime: etaPickup,
                distanceBest: request.distanceBest,
                durationBest: request.durationBest,
                costBest: request.costBest,
                points: requestDto.locations.map(x=>x.loc),
                addresses: requestDto.locations.map(x=>x.add),
                serviceId: requestDto.services[0].serviceId
            };
            Container.get(Redis).request.add(requestInRedis, requestDto.intervalMinutes)
            if(requestDto.intervalMinutes == null || requestDto.intervalMinutes < 30) {
                for (let driver of driversWithService) {
                    Container.get(Redis).request.driverNotified(request['id'] as number, driver.id);
                    (Container.get('io') as any).of('/drivers').to(Container.get('drivers')[driver.id]).emit('requestReceived', requestInRedis)
                }
                let _drivers = driversWithService.filter(x => x.notificationPlayerId != null)
                Container.get(Notifier).driver.requests(_drivers, request['id'])
            }
            callback();
        }
        catch (err) {
            callback(new UnknownException(err));
        }
    }

    async cancelRequest(callback) {
        let query = {};
        if(this.userType == UserType.Admin) {
            query = { operator: { id: this.socket.user.id } };
        } else {
            query = { rider : { id: this.socket.user.id } };
        }
        let travel = (await Request.findOne({order: {id : "DESC"}, where: query}));
        await Container.get(Redis).request.expire(travel.id);
        let otherDriverIds = await Container.get(Redis).request.getDriversNotified(travel.id);
        for (let otherDriverId of otherDriverIds) {
            (Container.get('io') as any).of('/drivers').to((Container.get('drivers'))[otherDriverId]).emit('cancelRequest', travel.id);
        }
        Request.update(travel.id, { status: RequestStatus.RiderCanceled });
        
        callback();
    }
}