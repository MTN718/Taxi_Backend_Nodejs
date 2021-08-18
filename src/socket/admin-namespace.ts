import { Server } from "socket.io";
import { AdminSocket } from "../models/admin-jwt-decoded";
import socketioJwt from 'socketio-jwt';
import CrudController from "./operator/crud-controller";
import DashboardController from "./operator/dashboard-controller";
import MediaController from "./operator/media-controller";
import RegionController from "./operator/region-controller";
import ServiceController from "./common/service-controller";
import SettingsController from "./operator/settings-controller";
import MiscController from "./operator/misc-controller";
import RequestTrackerController from "./operator/request-tracker-controller";
import { UserType } from "../models/enums/enums";
import { SocketWithUser } from "./interfaces/socket.controller.interface";
import Container from "typedi";

export default class AdminNamespace {
    constructor() {
        (Container.get('io') as Server).of('/operators').use(socketioJwt.authorize({
            secret: Container.get('token'),
            handshake: true,
            decodedPropertyName: 'user'
        })).use((socket: SocketWithUser, next: (err?: any) => void) => {
            next();
        }).on('connection', (socket: AdminSocket) => {
            new ServiceController(socket, UserType.Admin)
            new CrudController(socket)
            new DashboardController(socket)
            new SettingsController(socket)
            new RegionController(socket)
            new MediaController(socket)
            new MiscController(socket)
            new RequestTrackerController(socket)
        });
    }
}