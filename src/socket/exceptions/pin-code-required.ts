import SocketException, { SocketStatus } from './socket-exception'

export default class PINCodeRequired extends SocketException {
    constructor() {
        super(SocketStatus.PINCodeRequired, 'PIN code required');
    }
}