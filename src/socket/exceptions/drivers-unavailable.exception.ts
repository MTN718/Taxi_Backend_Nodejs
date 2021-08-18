import SocketException, { SocketStatus } from './socket-exception'

export default class DriversUnavailableException extends SocketException {
    constructor() {
        super(SocketStatus.DriversUnavailable, `No driver found with service enabled.`)
    }
}