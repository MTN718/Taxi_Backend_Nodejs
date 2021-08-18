import SocketController from "../interfaces/socket.controller.interface";
import { Promotion } from "../../entities/promotion";
import Container from "typedi";
import Redis from "../../libs/redis/redis";
import { Media, MediaType } from "../../entities/media";
import Uploader from "../../libs/uploader";
import { Rider } from "../../entities/rider";
import { RiderAddress } from "../../entities/rider-address";
import { RiderFavDriver } from "../../entities/rider-fav-driver";
import { LessThan, MoreThan } from "typeorm";
import UnknownException from "../exceptions/unknown.exception";
import CoordinateXY from "../../models/coordinatexy";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { Driver } from "../../entities/driver";

export default class RiderMiscController extends SocketController {
    constructor(socket: any) {
        super(socket);
        socket.on('GetDriversLocations', this.getDriversLocation.bind(this));
        socket.on('GetFavDrivers', this.getDrivers.bind(this));
        socket.on('InsertFavDriver', this.addFavDriver.bind(this));
        socket.on('DeleteFavDriver', this.deleteFavDriver.bind(this));
        socket.on('CheckFavDriver', this.checkFavDriver.bind(this));
        socket.on('UpdateProfile', this.editProfile.bind(this));
        socket.on('UpdateProfileImage', this.changeProfileImage.bind(this));
        socket.on('GetAddresses', this.getAddresses.bind(this));
        socket.on('DeleteAddress', this.deleteAddress.bind(this));
        socket.on('UpsertAddress', this.upsertAddress.bind(this));
        socket.on('GetPromotions', this.getPromotions.bind(this))
    }

    async editProfile(user: Rider, callback) {
        try {
            let _user: QueryDeepPartialEntity<Rider> = {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                gender: user.gender,
                address: user.address
            }
            Rider.update(this.socket.user.id, _user)
            callback();
        }
        catch (err) {
            this.throwException(callback, new UnknownException(err));
        }
    }

    async changeProfileImage(buffer, callback) {
        try {
            let mediaId = (await Media.insert({ type: MediaType.RiderImage })).raw.insertId
            let uploader = new Uploader();
            let mediaRow = await uploader.doUpload(buffer, mediaId);
            await Rider.update(this.socket.user.id, {media: {id: mediaId}});
            callback(mediaRow);
        } catch (error) {
            this.throwException(callback, new UnknownException(error));
        }
    }

    async getDriversLocation(point: CoordinateXY, callback: (arg0: CoordinateXY[]) => void) {
        let result = await Container.get(Redis).driver.getClose(point,1000);
        callback(result.map(x=>x.location));
    }

    async getAddresses(callback) {
        callback(await RiderAddress.find({where: {rider: {id: this.socket.user.id}}}));
    }

    async getDrivers(callback) {
        let drivers = await RiderFavDriver.find({where: {riderId: this.socket.user.id}});
        let results = [];
        console.log(drivers);
        for (let i = 0;i < drivers.length;i++)
        {
            let drvInfo = await Driver.findOne({where:{id:drivers[i].driverId}})
            if (drvInfo)
            {
                results.push(drvInfo);
            }
        }
        console.log(results);
        console.log({drivers:results});
        callback(results);
    }

    async deleteFavDriver(id:number,callback){
        console.log(id)
        await RiderFavDriver.delete({driverId:id,riderId:this.socket.user.id});
        callback();
    }

    async deleteAddress(id: number, callback) {
        await RiderAddress.delete(id);
        callback();
    }

    async checkFavDriver(params,callback){
        console.log(params);
        let newFav = new RiderFavDriver;

        let drivers = await RiderFavDriver.find({where: {riderId: this.socket.user.id,driverId:params.driverId}});
        if (drivers.length == 0)
        {    
            callback(true);    
        }
        else 
            callback(false);
        
    }
    async addFavDriver(params,callback){
        console.log(params);
        let newFav = new RiderFavDriver;

        let drivers = await RiderFavDriver.find({where: {riderId: this.socket.user.id,driverId:params.driverId}});
        if (drivers.length == 0)
        {    
            newFav.riderId =this.socket.user.id;
            newFav.driverId = params.driverId;
            await RiderFavDriver.save(newFav);
        }
        callback();
    }

    async upsertAddress(address: RiderAddress, callback) {
        address.rider = {id: this.socket.user.id} as Rider;
        await RiderAddress.save(address);
        callback();
    }
    
    async getPromotions(callback) {
        let now = new Date().getTime();
        let promotions = (await Promotion.find({
            relations: ['media'],
            order: { 'id': "DESC" }
        })).filter(x=>x.startTimestamp < now && x.expirationTimestamp > now);
        callback(promotions);
    }
}