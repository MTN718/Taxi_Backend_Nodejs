import SocketController from "../interfaces/socket.controller.interface";
import { Region } from "../../entities/region";
import { ServiceCategory } from "../../entities/service-category";
import { Request, RequestStatus } from "../../entities/request";
import { Driver } from "../../entities/driver";
import { RequestReview } from "../../entities/request-review";
import Container from "typedi";
import GeoLib from "../../libs/geo";
import UnknownException from "../exceptions/unknown.exception";
import RegionUnsupportedException from "../exceptions/region-unsupported.exception";
import NoServiceInRegionException from "../exceptions/no-service-in-region.exception";
import CoordinateXY from "../../models/coordinatexy";
import SocketException from "../exceptions/socket-exception";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { DistanceFee } from "../../entities/service";

export default class RiderTripController extends SocketController {
    constructor(socket: any) {
        super(socket)
        socket.on('CalculateFare', this.calculateFare.bind(this));
        socket.on('ReviewDriver', this.reviewDriver.bind(this));
        socket.on('EnableConfirmation', this.enableConfirmation.bind(this));
    }

    async calculateFare(locations: CoordinateXY[], callback: (arg0: CalculateFareResult | SocketException) => void) {
        try {
            let regions: Region[] = await Region.query("SELECT * FROM region WHERE enabled=TRUE AND ST_Within(st_geomfromtext('POINT(? ?)'), region.location)", [locations[0].x, locations[0].y]);
            if (regions.length < 1) {
                callback(new RegionUnsupportedException());
                return
            }
            let servicesInRegion = (await Region.findOne(regions[0].id, { relations: ['services']})).services;
            if(servicesInRegion.length < 1) {
                callback(new NoServiceInRegionException());
                return
            }
            let cats = await ServiceCategory.find({relations: ['services', 'services.media']});
            for(let cat of cats) {
                cat.services = cat.services.filter(x=> servicesInRegion.filter(y => y.id == x.id).length > 0);
            }
            cats = cats.filter(x => x.services.length > 0);
            let res: CalculateFareResult = {
                currency: regions[0].currency,
                categories: cats
            }
            if(servicesInRegion.filter(x=>x.distanceFeeMode == DistanceFee.PickupToDestination).length > 0) {
                let metrics = await Container.get(GeoLib).calculateDistance(locations);
                if (metrics.json.status !== "OK") {
                    callback(new UnknownException('No Route Found'));
                    return;
                }
                res.distance = metrics.json.rows[0].elements.reduce((a, b) => {return a + b.distance.value}, 0);
                res.duration = metrics.json.rows[0].elements.reduce((a, b) => {return a + b.duration.value}, 0);
            } else {
                res.distance = 0;
                res.duration = 0;
            }
            callback(res);
        } catch (error) {
            console.log(error);
            if(error.json?.error_message != null) {
                callback(new UnknownException(error.json?.error_message));
            } else {
                callback(new UnknownException(error.message));
            }
        }
    }

    async reviewDriver(reviewDto: RequestReview, callback) {
        let req = await Request.findOne({where: {rider: {id: this.socket.user.id}}, order: {id: 'DESC'}, relations: ['driver','review']});
        if(req.review == null) {
            let reviewCount = req.driver.reviewCount + 1;
            let newScore = ((reviewDto.score - (req.driver.rating | 0)) / reviewCount) + (req.driver.rating | 0);
            await Driver.update(req.driver.id, {reviewCount: reviewCount, rating: newScore});
            await RequestReview.insert({request: {id: req.id}, driver: {id: req.driver.id}, review: reviewDto.review, score: reviewDto.score});
        } else {
            let newScore = ((reviewDto.score - req.review.score - (req.driver.rating | 0)) / req.driver.reviewCount) + (req.driver.rating | 0);
            await Driver.update(req.driver.id, {rating: newScore});
            RequestReview.update(req.review.id, {review: reviewDto.review, score: reviewDto.score});
        }
        let query: QueryDeepPartialEntity<Request> = {rating: reviewDto.score};
        if(req.status == RequestStatus.WaitingForReview) {
            query.finishTimestamp = new Date().getTime();
            query.status = RequestStatus.Finished;
        }
        await Request.update(req.id, query);
        callback();
    }

    async enableConfirmation(callback: (arg0: number) => void) {
        let req = await Request.findOne({where: {rider: {id: this.socket.user.id}}, order: {id: 'DESC'}});
        if (req.confirmationCode == null) {
            let code = Math.floor(Math.random() * 8999 + 1000)
            await Request.update(req.id, {confirmationCode: code})
            callback(code)
        } else {
            callback(req.confirmationCode)
        }
    }
}

export type CalculateFareResult = { categories: ServiceCategory[], distance?: number, duration?: number, currency: string}