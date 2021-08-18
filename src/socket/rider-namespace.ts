import { Server } from "socket.io";
import { BraintreeGateway } from 'braintree';
import socketioJwt from 'socketio-jwt';
import SocketMiddlewares from "./middlewares";
import ChatController from "./common/chat-controller";
import RequestCommonsController from "./common/request-commons-controller";
import RequestHistoryController from "./common/request-history-controller";
import WalletController from "./common/wallet-controller";
import ServiceController from "./common/service-controller";
import { UserType } from "../models/enums/enums";
import CouponsController from "./rider/coupons-controller";
import RiderMiscController from "./rider/rider-misc-controller";
import RiderTripController from "./rider/rider-trip-controller";
import Container from "typedi";
import { ClientSocket } from "../models/client-jwt-decoded";

export default class DriverNamespace {
    brain?: BraintreeGateway;
    constructor() {
        let mw = new SocketMiddlewares();
        (Container.get('io') as Server).of('/riders').use(socketioJwt.authorize({
            secret: Container.get('token'),
            handshake: true,
            decodedPropertyName: 'user'
        }))
            .use(mw.validateRider)
            .on('connection', function (socket: ClientSocket) {
                socket.on('disconnect', () => {
                    delete Container.get('riders')[socket.user.id];
                })
                Container.get('riders')[socket.user.id] = socket.id;
                new ChatController(socket, UserType.Rider);
                new RequestCommonsController(socket);
                new RequestHistoryController(socket, UserType.Rider);
                new WalletController(socket);
                new ServiceController(socket, UserType.Rider);
                new CouponsController(socket);
                new RiderMiscController(socket);
                new RiderTripController(socket);
            });
    }
}