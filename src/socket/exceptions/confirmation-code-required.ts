import SocketException, { SocketStatus } from './socket-exception'

export default class ConfirmationCodeRequired extends SocketException {
    constructor() {
        super(SocketStatus.ConfirmationCodeRequired, 'Confirmation Code is required');
    }
}