import { Server } from "socket.io";
import { AdminSocket } from "../models/admin-jwt-decoded";
import socketioJwt from 'socketio-jwt';
import CrudController from "./cms/crud-controller";
import DashboardController from "./cms/dashboard-controller";
import MediaController from "./cms/media-controller";
import RegionController from "./cms/region-controller";
import ServiceController from "./common/service-controller";
import SettingsController from "./cms/settings-controller";
import MiscController from "./cms/misc-controller";
import RequestTrackerController from "./cms/request-tracker-controller";
import { UserType } from "../models/enums/enums";
import { SocketWithUser } from "./interfaces/socket.controller.interface";
import Container from "typedi";

export default class CMSNamespace {
    constructor() {
        (Container.get('io') as Server).of('/cms').use(socketioJwt.authorize({
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