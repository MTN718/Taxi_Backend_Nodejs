import SocketException, { SocketStatus } from './socket-exception'

export default class DistanceCalculationFailedException extends SocketException {
    constructor(status: string) {
        super(SocketStatus.DistanceCalculationFailed, `Distance Calculation failed with status code: ${status}`)
    }
}