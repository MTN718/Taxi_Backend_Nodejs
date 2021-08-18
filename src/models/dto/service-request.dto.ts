import CoordinateXY from "../coordinatexy";

export interface ServiceRequestDto {
    locations: LocationWithName[],
    services: OrderedService[],
    riderId?: number,
    intervalMinutes?: number,
    driverId?:number
}

export interface LocationWithName {
    loc: CoordinateXY,
    add: string
}

export interface OrderedService {
    serviceId: number,
    quantity: number
}