import CoordinateXY from './coordinatexy'
export type DriverLocation = {
    location: CoordinateXY
}

export type DriverLocationWithId = DriverLocation & { driverId: number }

export type DriverLocationWithDist = DriverLocation & { distance: number }

export type DriverLocationWithDistAndId = DriverLocationWithDist & { driverId: number }