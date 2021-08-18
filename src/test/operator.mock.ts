import { PermissionDefault } from "../entities/operator";

export const _operator = {
    id: 1,
    userName: 'john',
    password: 'doe',
    permissionCar: [PermissionDefault.View],
    permissionRider: [PermissionDefault.View],

}