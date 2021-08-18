import SocketException, { SocketStatus } from './socket-exception'

export default class OrderAlreadyTaken extends SocketException {
    constructor() {
        super(SocketStatus.OrderAlreadyTaken, 'Order Already Taken');
    }
}