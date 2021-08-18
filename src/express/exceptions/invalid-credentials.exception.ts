import HttpException, { HTTPStatus } from './http-exception'

export default class InvalidCredentialsException extends HttpException {
    constructor() {
        super(HTTPStatus.InvalidCredentials, "Credentials are invalid.")
    }
}