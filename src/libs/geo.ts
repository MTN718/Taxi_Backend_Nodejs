import GMap, { GoogleMapsClientWithPromise, DistanceMatrixResponse, ClientResponse } from "@google/maps";
import CoordinateXY from "../models/coordinatexy";

export default class GeoLib {
    gMap: GoogleMapsClientWithPromise;

    constructor(googleMapsAPIKey: string) {
        this.gMap = GMap.createClient({
            key: googleMapsAPIKey,
            Promise: Promise
        });
    }

    async calculateDistance(coordinates: CoordinateXY[]): Promise<ClientResponse<DistanceMatrixResponse>> {
        return this.gMap.distanceMatrix({
            origins: [[coordinates[0].y, coordinates[0].x]],
            destinations: coordinates.slice(1).map(x=>{
                return {lat: x.y, lng:x.x}
            })}).asPromise();
    }
}