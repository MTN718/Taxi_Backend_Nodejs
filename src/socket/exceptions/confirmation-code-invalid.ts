import SocketException, { SocketStatus } from './socket-exception'

export default class ConfirmationCodeInvalid extends SocketException {
    constructor() {
        super(SocketStatus.ConfirmationCodeInvalid, 'Confirmation Code invalid');
    }
}