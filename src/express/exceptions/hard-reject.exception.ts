import HttpException, { HTTPStatus } from "./http-exception";

export default class HardRejectException extends HttpException {
    constructor(message: string) {
        super(HTTPStatus.HardReject, `Your profile has been hard rejected for following reason: ${message}`)
    }
}