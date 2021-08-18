import SocketController from "../interfaces/socket.controller.interface";
import Container from "typedi";
import Redis from "../../libs/redis/redis";
import { DriverStatus, Driver } from "../../entities/driver";
import { Request, RequestStatus } from "../../entities/request";
import CoordinateXY from "../../models/coordinatexy";
import GeoLib from "../../libs/geo";
import OrderAlreadyTaken from '../exceptions/order-already-taken'
import DistanceCalculationFailedException from "../exceptions/distance-calculation-failed.exception";
import UnknownException from "../../express/exceptions/unknown.exception";
import { getRepository } from "typeorm";
import { Stats } from "../../models/stats";

export default class PreServiceController extends SocketController {
    constructor(socket: any) {
        super(socket)
        socket.on('UpdateStatus', this.changeStatus.bind(this))
        socket.on('GetAvailableRequests', this.getRequests.bind(this))
        socket.on('AcceptOrder', this.acceptOrder.bind(this))
    }

    async changeStatus(turnOnline: boolean, callback) {
        if (!turnOnline) {
            await Container.get(Redis).driver.expire(this.socket.user.id);
            delete Container.get('drivers')[this.socket.user.id];
            (Container.get('io') as any).of('/cms').emit('driverLocationUpdated', {id: this.socket.user.id, loc: null});
        }
        await getRepository('Driver').save({ id: this.socket.user.id, status: (turnOnline ? DriverStatus.Online : DriverStatus.Offline), lastSeenTimestamp: new Date().getTime()});
        callback()
    }

    async getRequests(callback) {
        let [requests, driver] = await Promise.all([
            Container.get(Redis).request.getForDriver(this.socket.user.id),
            Driver.findOne(this.socket.user.id, { relations: ['services']})
        ]);
        if (driver.status !== DriverStatus.Online) {
            callback(new UnknownException("Driver offline"));
            return;
        }
        let driverServiceIds = driver.services.map(x => x.id);
        requests = requests.filter(x => {
            return driverServiceIds.includes(x.serviceId)
        });
        for(let request of requests) {
            Container.get(Redis).request.driverNotified(request.id, this.socket.user.id);
        }
        callback(requests);
    }

    async acceptOrder(travelId: number, callback) {
        let [travel, driverLocation] = await Promise.all([
            Request.findOne(travelId, {relations: ['driver', 'driver.media', 'rider', 'service']}),
            Container.get(Redis).driver.getCoordinate(this.socket.user.id)
        ]);
        if(travel == null) {
            this.throwException(callback, new OrderAlreadyTaken());
            return;
        }
        if(travel.status != RequestStatus.Requested && travel.status != RequestStatus.Found && travel.status != RequestStatus.Booked) {
            this.throwException(callback, new OrderAlreadyTaken());
            return;
        }
        let locs: CoordinateXY[] = [travel.points[0], driverLocation];
        let metrics = await Container.get(GeoLib).calculateDistance(locs)
        if (metrics.json.status != 'OK') {
            this.throwException(callback, new DistanceCalculationFailedException(metrics.json.error_message))
            return;
        }
        let dt = new Date();
        let etaPickup = dt.setSeconds(dt.getSeconds() + metrics.json.rows[0].elements[0].duration.value)
        let _ = await Promise.all([
            Driver.update(this.socket.user.id, { status: DriverStatus.InService }),
            Request.update(travelId, {status: RequestStatus.DriverAccepted, etaPickup: etaPickup, driver: {id: this.socket.user.id}})
        ]);
        Container.get(Stats).availableDrivers = Container.get(Stats).availableDrivers - 1;
        (Container.get('io') as any).of('/cms').emit('statChanged', { key: 'availableDrivers', value: -1});
        Container.get(Stats).inServiceDrivers = Container.get(Stats).inServiceDrivers + 1;
        (Container.get('io') as any).of('/cms').emit('statChanged', { key: 'inService', value: 1});
        travel = await Request.findOne(travel.id, {relations: ['rider', 'driver','driver.media','service','operator']});
        if (travel.operator != null) {
            (Container.get('io') as any).of('/operators').clients((error, clients) => {
                if (error) throw error;
                let _clients = clients.filter(x => {
                    return (((Container.get('io') as any).of('/operators').connected[x] as any).user.id == travel.operator.id)
                });
                (Container.get('io') as any).of('/operators').to(_clients).emit('driverAccepted', travel)
            })
        } else {
            (Container.get('io') as any).of('/riders').to(Container.get('riders')[travel.rider.id]).emit('driverAccepted', travel);
        }
        let otherDriverIds = await Container.get(Redis).request.getDriversNotified(travelId);
        for (let otherDriverId of otherDriverIds) {
            if (this.socket.user.id !== otherDriverId)
            (Container.get('io') as any).of('/drivers').to(Container.get('drivers')[otherDriverId]).emit('cancelRequest', travelId);
        }
        callback(travel);
        await Container.get(Redis).request.expire(travelId);
    }
}