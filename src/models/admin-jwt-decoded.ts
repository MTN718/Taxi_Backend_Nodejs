import { Socket } from "socket.io";

export class AdminJWTDecoded {
    id: number;
}


export type AdminSocket = Socket & { user: AdminJWTDecoded };