import { Server } from "socket.io";
import socketioJwt from 'socketio-jwt';
import SocketMiddlewares from "./middlewares";
import ChatController from "./common/chat-controller";
import { UserType } from "../models/enums/enums";
import ClientMiscController from "./common/client-miscs-controller";
import RequestCommonsController from "./common/request-commons-controller";
import RequestHistoryController from "./common/request-history-controller";
import WalletController from "./common/wallet-controller";
import PaymentsController from "./driver/payments-controller";
import PreServiceController from "./driver/pre-service-controller";
import ServicingController from "./driver/servicing-controller";
import Container from "typedi";
import { ClientSocket } from "../models/client-jwt-decoded";
import { Driver } from "../entities/driver";

export default class DriverNamespace {
    constructor() {
        let mw = new SocketMiddlewares();
        (Container.get('io') as Server).of('/drivers').use(socketioJwt.authorize({
            secret: Container.get('token'),
            handshake: true,
            decodedPropertyName: 'user'
        }))
        .use(mw.validateDriver)
        .on('connection', function (socket: ClientSocket) {
            socket.on('disconnect', async () => {
                delete Container.get('drivers')[socket.user.id];
            })
            Container.get('drivers')[socket.user.id] = socket.id;
            (Container.get('io') as Server).of('/operators').emit("driversOnline", Object.keys(Container.get('drivers')).length);
            new ChatController(socket, UserType.Driver);
            new ClientMiscController(socket);
            new RequestCommonsController(socket);
            new RequestHistoryController(socket, UserType.Driver);
            new WalletController(socket);
            new PaymentsController(socket);
            new PreServiceController(socket);
            new ServicingController(socket);
        });
    }
}