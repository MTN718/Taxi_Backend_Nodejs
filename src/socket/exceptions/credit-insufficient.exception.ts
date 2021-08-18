import SocketException, { SocketStatus } from './socket-exception'

export default class CreditInsufficientException extends SocketException {
    constructor() {
        super(SocketStatus.CreditInsufficient, 'Credit is not sufficient to enable.');
    }
}