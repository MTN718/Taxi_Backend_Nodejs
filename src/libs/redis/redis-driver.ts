import { DriverLocationWithId, DriverLocation } from "../../models/driver-location";
import Container from "typedi";
import CoordinateXY from "../../models/coordinatexy";

export default class RedisDriver {
    redis: any;

    constructor() {
        this.redis = Container.get('redis');
    }

    async setCoordinate(userId: number, coordinate: CoordinateXY) {
        await this.redis.geoaddAsync('driver', coordinate.x, coordinate.y, userId);
        await this.redis.zaddAsync('driver-location-time', Date.now(), userId);
    }

    async getCoordinate(driverId: number): Promise<CoordinateXY> {
        let res = await this.redis.geoposAsync('driver', driverId)
        if(res[0] != null && res[0][0] != null) {
            return { x: parseFloat(res[0][0]), y: parseFloat(res[0][1]) }
        } else {
            return null;
        }
    }

    async getClose(coordinate: CoordinateXY, distance: number): Promise<Array<DriverLocationWithId>> {
        let bare = await this.redis.georadiusAsync('driver', coordinate.x, coordinate.y, distance, 'm', 'WITHCOORD');
        return bare.map((x: Array<any>) => {
            return {
                driverId: parseInt(x[0] as string),
                location: {
                    y: parseFloat(x[1][1]),
                    x: parseFloat(x[1][0])
                }
            }
        });
    }

    async getAll(): Promise<Array<{driverId: number, location: {lat: number, lng: number}}>> {
        let bare = (await this.redis.georadiusAsync('driver', 45, 45, '22000', 'km', 'WITHCOORD') as Array<Array<any>>)
        return bare.map((x: Array<any>) => {
            return {
                driverId: parseInt(x[0] as string),
                location: { lat: parseFloat(x[1][1]), lng: parseFloat(x[1][0]) }
            }
        });
    }

    async expire(userId: number) {
        await this.redis.zremAsync('driver', userId);
        await this.redis.zremAsync('driver-location-time', userId);
    }
}