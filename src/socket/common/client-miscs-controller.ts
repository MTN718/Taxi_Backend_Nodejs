import SocketController from "../interfaces/socket.controller.interface";
import { Driver } from "../../entities/driver";
import { Rider } from "../../entities/rider";
import { ClientType } from "../../models/client-jwt-decoded";

export default class ClientMiscController extends SocketController {
    constructor(socket: any) {
        super(socket)
    }

    async notificationPlayerId (playerId: string) {
        if(this.socket.user.t == ClientType.Driver) {
            Driver.update(this.socket.user.id, {notificationPlayerId: playerId})
        } else {
            Rider.update(this.socket.user.id, {notificationPlayerId: playerId})
        }
    }
}