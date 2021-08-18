import SocketException, { SocketStatus } from './socket-exception'

export default class RegionUnsupportedException extends SocketException {
    constructor() {
        super(SocketStatus.RegionUnsupported, `Region is not supported.`)
    }
}