import SocketController from "../interfaces/socket.controller.interface";
import { Operator, PermissionDefault } from "../../entities/operator";
import { Region } from "../../entities/region";
import CoordinateXY from "../../models/coordinatexy";

export default class RegionController extends SocketController {
    constructor(socket: any) {
        super(socket)
        socket.on('upsertRegion', this.upsertRegion.bind(this))
    }

    async upsertRegion(row: UpsertRegionDto, callback) {
        let operator = await Operator.findOne(this.socket.user.id);
        if (!operator.permissionRegion.includes(PermissionDefault.Update)) {
            callback(411);
            return;
        }
        if(row.id == null) {
            await Region.insert({location: [row.location], enabled: row.enabled, name: row.name, currency: row.currency});
        } else {
            await Region.update(row.id, {location: [row.location], enabled: row.enabled, name: row.name, currency: row.currency});
        }
        callback(200)
    }
}

interface UpsertRegionDto {
    id?: number,
    name: string,
    enabled: boolean,
    currency: string,
    location: CoordinateXY[]
}