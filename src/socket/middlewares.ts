import { Driver, DriverStatus } from '../entities/driver';
import { Rider, RiderStatus } from '../entities/rider';
import { ClientSocket } from '../models/client-jwt-decoded';

export default class SocketMiddlewares {
    constructor() {
    }

    async validateDriver(socket: ClientSocket, next: (err?:any) => void) {
        if (socket.handshake.query.os) {
            if (socket.handshake.query.ver) {
                var minVersion = 1;
                if (socket.handshake.query.os == 'android') {
                    minVersion = parseInt(process.env.DRIVER_MIN_VERSION_ANDROID)
                } else {
                    minVersion = parseInt(process.env.DRIVER_MIN_VERSION_IOS)
                }
                if (parseInt(socket.handshake.query.ver) < minVersion) {
                    next(MiddlewareErrors.VersionOutdated);
                }
            }
        }
        let user = await Driver.findOne({ where: { id: socket.user.id }})
        if (user == null) {
            next(new Error(MiddlewareErrors.NotFound));
            return;
        }
        if (user.status == DriverStatus.Blocked || user.status == DriverStatus.HardReject) {
            next(new Error(MiddlewareErrors.Blocked));
            return;
        }
        if (user.status == DriverStatus.PendingApproval || user.status == DriverStatus.WaitingDocuments || user.status == DriverStatus.SoftReject) {
            next(new Error(MiddlewareErrors.RegistrationIncomplete));
            return;
        }
        if(user.notificationPlayerId != socket.handshake.query.not && socket.handshake.query.not != null) {
            await Driver.update(user.id, { notificationPlayerId: socket.handshake.query.not})
        }
        next();
    }

    async validateRider(socket: ClientSocket, next: (err?:any) => void) {
        if (socket.handshake.query.os) {
            if (socket.handshake.query.ver) {
                var minVersion = 1;
                if (socket.handshake.query.os == 'android') {
                    minVersion = parseInt(process.env.RIDER_MIN_VERSION_ANDROID)
                } else {
                    minVersion = parseInt(process.env.RIDER_MIN_VERSION_IOS)
                }
                if (parseInt(socket.handshake.query.ver) < minVersion) {
                    next(new Error('This version is outdated. Please update to latest version.'));
                }
            }
        }
        let user = await Rider.findOne({ where: { id: socket.user.id }})
        if (user == null) {
            next(new Error(MiddlewareErrors.NotFound));
            return;
        }
        if (user.status == RiderStatus.Blocked) {
            next(new Error(MiddlewareErrors.Blocked));
            return;
        }
        if(user.notificationPlayerId != socket.handshake.query.not && socket.handshake.query.not != null) {
            await Rider.update(user.id, { notificationPlayerId: socket.handshake.query.not})
        }
        next();
    }
}

export enum MiddlewareErrors {
    VersionOutdated = "VersionOutdated",
    NotFound = "NotFound",
    Blocked = "Blocked",
    RegistrationIncomplete = "RegistrationIncomplete"
}