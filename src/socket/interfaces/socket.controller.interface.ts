import { Socket } from "socket.io";
import { UserType } from "../../models/enums/enums";
import SocketException from "../exceptions/socket-exception";
import ClientJWTDecoded from "../../models/client-jwt-decoded";

export type SocketWithUser = Socket & { user: ClientJWTDecoded }


export default class SocketController {
    socket: SocketWithUser
    userType: UserType

    constructor(socket: any, userType?: UserType) {
        this.socket = socket;
        if(userType) {
            this.userType = userType;
        }
    }

    throwException(callback: any, error: SocketException) {
        callback({
            status: error.status,
            message: error.message
        })
    }
}