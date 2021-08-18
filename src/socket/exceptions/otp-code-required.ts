import SocketException, { SocketStatus } from './socket-exception'

export default class OTPCodeRequired extends SocketException {
    constructor(transactionId: string) {
        super(SocketStatus.OTPCodeRequired, transactionId);
    }
}