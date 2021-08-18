import SocketController from "../interfaces/socket.controller.interface";
import { Request, RequestStatus } from "../../entities/request";
import UnknownException from "../exceptions/unknown.exception";
import Container from "typedi";
import { In } from "typeorm";
import { Driver, DriverStatus } from "../../entities/driver";
import { ClientType } from "../../models/client-jwt-decoded";
import Redis from "../../libs/redis/redis";
import { Stats } from "../../models/stats";
export default class RequestCommonsController extends SocketController {
    constructor(socket: any) {
        super(socket)
        socket.on('Cancel', this.cancelService.bind(this))
        socket.on('GetCurrentRequestInfo', this.GetCurrentRequestInfo.bind(this))
    }

    async GetCurrentRequestInfo(callback) {
        let notFinishedRequestTypes: RequestStatus[] = [
            RequestStatus.Requested,
            RequestStatus.DriverAccepted,
            RequestStatus.Found,
            RequestStatus.Started,
            RequestStatus.WaitingForPostPay,
            RequestStatus.WaitingForPrePay,
            RequestStatus.Booked,
            RequestStatus.Arrived
        ];
        if(this.socket.user.t == ClientType.Rider) {
            notFinishedRequestTypes.push(RequestStatus.WaitingForReview)
        }
        let query = this.socket.user.t == ClientType.Driver ? { driver: { id: this.socket.user.id } } : { rider: { id: this.socket.user.id } };
        let request = await Request.findOne({ where: query, order: { id: 'DESC' }, relations: ['driver', 'driver.media', 'rider','service'] });
        if (request != undefined && notFinishedRequestTypes.filter(x=>x == request.status).length != 0) {
            if(this.socket.user.t == ClientType.Rider && request.driver != null) {
                let loc = await Container.get(Redis).driver.getCoordinate(request.driver.id);
                if(loc != null) {
                    callback({request: request, driverLocation: loc});
                } else {
                    callback({request: request});
                }
            } else {
                callback({request: request});
            }
        } else {
            callback(new UnknownException('No travel was found'));
        }
    }

    async cancelService(callback) {
        if (this.socket.user.t == ClientType.Driver) {
            let request = await Request.findOne({ where: { driver: { id: this.socket.user.id } }, order: { id: 'DESC' }, relations: ['rider'] })
            await Request.update(request.id, { status: RequestStatus.DriverCanceled, finishTimestamp: new Date().getTime() });
            (Container.get('io') as any).of('/riders').to(Container.get('riders')[request.rider.id]).emit('cancelTravel');
            await Driver.update(this.socket.user.id, {status: DriverStatus.Online});
        } else {
            let request = await Request.findOne({ where: { rider: { id: this.socket.user.id } }, order: { id: 'DESC' }, relations: ['driver'] });
            await Request.update(request.id, { status: RequestStatus.RiderCanceled, finishTimestamp: new Date().getTime() });
            (Container.get('io') as any).of('/drivers').to(Container.get('drivers')[request.driver.id]).emit('cancelTravel');
            await Driver.update(request.driver.id, {status: DriverStatus.Online});
        }
        Container.get(Stats).availableDrivers = Container.get(Stats).availableDrivers + 1;
        (Container.get('io') as any).of('/cms').emit('statChanged', { key: 'availableDrivers', value: 1});
        Container.get(Stats).inServiceDrivers = Container.get(Stats).inServiceDrivers - 1;
        (Container.get('io') as any).of('/cms').emit('statChanged', { key: 'inService', value: -1});
        callback()
    }
}