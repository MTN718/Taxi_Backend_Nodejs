import SocketException, { SocketStatus } from './socket-exception'

export default class NoServiceInRegionException extends SocketException {
    constructor() {
        super(SocketStatus.RegionUnsupported, `No Service in region.`)
    }
}