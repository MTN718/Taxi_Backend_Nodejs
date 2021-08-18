import SocketController from "../interfaces/socket.controller.interface";
import { Operator } from "../../entities/operator";

export default class SettingsController extends SocketController {
    constructor(socket: any) {
        super(socket)
        socket.on('updateOperatorPassword', this.updateOperatorPassword.bind(this))
    }

    async updateOperatorPassword(oldPass: string, newPass: string, callback) {
        if (process.env.NODE_ENV === "dev")
            return;
        let result = await Operator.update({id: this.socket.user.id, password: oldPass}, {password: newPass});
        if (result.affected == 1) {
            callback(200);
        }
        else {
            callback(403);
        }
    }
}