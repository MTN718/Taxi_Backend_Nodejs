import SocketException, { SocketStatus } from './socket-exception'

export default class UnknownException extends SocketException {
    constructor(message: string) {
        super(SocketStatus.Unknown, `-${message}-`)
    }
}