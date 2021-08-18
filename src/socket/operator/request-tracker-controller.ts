import SocketController from "../interfaces/socket.controller.interface";
import { Request, RequestStatus } from "../../entities/request";
import { In } from "typeorm";
import Container, { Service } from "typedi";
import Redis from "../../libs/redis/redis";

@Service()
export default class RequestTrackerController extends SocketController {
    constructor(socket: any) {
        super(socket)
        socket.on('getUnassignedRequests', this.getUnassignedRequests.bind(this))
        socket.on('getAssignedRequests', this.getAssignedRequests.bind(this))
        socket.on('getRequestDetails', this.getRequestDetails.bind(this))
    }

    async getUnassignedRequests(callback: (arg0: any) => void) {
        let result = await Container.get(Redis).request.getAll();
        let count = result.length
        callback({
            data: result,
            count: count
        })
    }

    async getAssignedRequests(callback: (arg0: any) => void) {
        let result = await Request.find({ where: { status: In([RequestStatus.DriverAccepted, RequestStatus.Started])}})
        let count = result.length
        callback({
            data: result.map(x=>{
                    return {
                    expectedTime: x.expectedTimestamp,
                    address: x.addresses[0]
                }
            }),
            count: count
        })
    }

    async getRequestDetails(requestId: number, callback) {
        let request = await Request.findOne(requestId)
        callback(request)
    }
}