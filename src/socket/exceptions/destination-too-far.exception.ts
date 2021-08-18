import SocketException, { SocketStatus } from './socket-exception'

export default class DestinationTooFarException extends SocketException {
    constructor() {
        super(SocketStatus.DestinationTooFar, `Destination is too far.`)
    }
}