import SocketController from "../interfaces/socket.controller.interface";
import { Operator } from "../../entities/operator";

export default class SettingsController extends SocketController {
    constructor(socket: any) {
        super(socket)
        socket.on('updateOperatorPassword', this.updateOperatorPassword.bind(this))
    }

    async updateOperatorPassword(dto: {oldPass: string, newPass: string}, callback) {
        if (process.env.NODE_ENV === "dev") {
            callback(201);
            return;
        }
        let result = await Operator.update({id: this.socket.user.id, password: (dto.oldPass != undefined ? dto.oldPass : '')}, {password: dto.newPass});
        callback(result.raw.affectedRows == 1 ? 200 : 403);
    }
}