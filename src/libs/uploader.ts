import { promises as fs } from "fs";
import { Media, PathType } from "../entities/media";

export default class Uploader {
    constructor() {
    }

    async doUpload(buffer: any, mediaId: number) {
        const fileName = `${Date.now()}.png`;
        let mediaType = (await Media.findOne(mediaId)).type;
        const relativePath = `img/${mediaType}/${fileName}`;
        const fullPath = `${process.cwd()}/public/${relativePath}`;
        let fd = await fs.open(fullPath, 'a', 0o755);
        await fd.writeFile(buffer);
        fd.close();
        await this.removePicture(mediaId);
        await this.updateDatabase(mediaId, relativePath);
        return (Media.findOne(mediaId));
    }

    async removePicture(mediaId: number) {
        try {
            let previousImage = await Media.findOne(mediaId);
            if (previousImage !== null && previousImage.address !== null) {
                let add = `${process.cwd()}/public/${previousImage.address}`;
                await fs.stat(add);
                return fs.unlink(add);
            }
        }
        catch (err) {
            console.log(err);
        }
    }

    async updateDatabase(mediaId: number,path: string) {
        return Media.update(mediaId, {address: path, pathType: PathType.Relative});
    }
}