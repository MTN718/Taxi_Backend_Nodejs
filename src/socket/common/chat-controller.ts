import SocketController from "../interfaces/socket.controller.interface";
import { UserType } from "../../models/enums/enums";
import { Request, RequestStatus } from "../../entities/request";
import UnknownException from "../exceptions/unknown.exception";
import { RequestChat } from "../../entities/request-chat";
import Container from "typedi";
import Notifier from "../../libs/notifier/notifier";
import { ClientType } from "../../models/client-jwt-decoded";

export default class ChatController extends SocketController {
    constructor(socket: any, userType: UserType) {
        super(socket, userType)
        socket.on('SendMessage',this.sendMessage.bind(this))
        socket.on('GetMessages',this.getMessages.bind(this))
    }

    async getMessages (callback) {
        let req: Request;
        if(this.socket.user.t == ClientType.Driver) { 
            req = await Request.findOne({where: { driver: {id: this.socket.user.id}}, order: {id: "DESC"}})
        } else {
            req = await Request.findOne({where: { rider: {id: this.socket.user.id}}, order: {id: "DESC"}})
        }
        if(req == undefined || req.status != RequestStatus.DriverAccepted) {
            this.throwException(callback, new UnknownException("Ride not available"))
            return
        }
        let messages = await RequestChat.find({where: {request: {id: req.id}}})
        callback(messages)
    }

    async sendMessage(content, callback) {
        let req: Request;
        if(this.socket.user.t == ClientType.Driver) { 
            req = await Request.findOne({where: { driver: {id: this.socket.user.id}}, order: {id: "DESC"}, relations: ['driver', 'rider']})
        } else {
            req = await Request.findOne({where: { rider: {id: this.socket.user.id}}, order: {id: "DESC"}, relations: ['driver', 'rider']})
        }
        if(req == undefined || req.status != RequestStatus.DriverAccepted) {
            callback(new UnknownException("Ride not available"))
            return
        }
        let insertResult = await RequestChat.insert({
            request: req,
            content: content as string,
            sentBy: this.socket.user.t == ClientType.Driver ? ClientType.Driver : ClientType.Rider
        });
        let message = await RequestChat.findOne({where: {id: insertResult.raw.insertId}, relations: ['request']})
        callback(message)
        if(this.socket.user.t == ClientType.Driver) {
            (Container.get('io') as any).of('/riders').to(Container.get('riders')[req.rider.id]).emit('messageReceived', message);
            Container.get(Notifier).rider.message(req.rider, message)
        } else {
            (Container.get('io') as any).of('/drivers').to(Container.get('drivers')[req.driver.id]).emit('messageReceived', message);
            Container.get(Notifier).driver.message(req.driver, message)
        }
    }
}