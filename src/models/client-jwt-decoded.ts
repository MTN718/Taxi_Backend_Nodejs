import { Socket } from "socket.io";

export default class ClientJWTDecoded {
    id: number;
    t: ClientType;
}

export type ClientSocket = Socket & { user: ClientJWTDecoded };

export enum ClientType {
    Driver = 'd',
    Rider = 'r'
}