import SocketController from "../interfaces/socket.controller.interface";
import { Media, MediaType } from "../../entities/media";
import Uploader from "../../libs/uploader";
import CMSException, { UnknownException } from "./exceptions/cms.exception";

export default class MediaController extends SocketController {

    constructor(socket: any) {
        super(socket)
        if(socket != null) {
            socket.on('updateMedia', this.updateMedia);
            socket.on('newMedia', this.newMedia);
        }
    }

    async updateMedia(buffer, mediaId: number, callback: (arg0: CMSException | string) => void) {
        try {
            let uploader = new Uploader();
            let mediaRow = await uploader.doUpload(buffer, mediaId);
            callback(mediaRow.address);
        } catch (error) {
            callback(new UnknownException(JSON.stringify(error)));
        }
    }

    async newMedia(buffer, type: string, callback: (arg0: CMSException | string) => void) {
        try {
            let mediaId = (await Media.insert({ type: type as MediaType })).raw.insertId
            let uploader = new Uploader();
            let mediaRow = await uploader.doUpload(buffer, mediaId);
            callback(mediaRow.address);
        } catch (error) {
            callback(new UnknownException(JSON.stringify(error)));
        }
    }
}