import HttpException, { HTTPStatus } from "./http-exception";

export default class UnknownException extends HttpException {
    constructor(message: string) {
        super(HTTPStatus.Unknown, `Unkown Exception occured: ${message}`)
    }
}