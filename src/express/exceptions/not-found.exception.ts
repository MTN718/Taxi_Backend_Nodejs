import HttpException, { HTTPStatus } from './http-exception'

export default class NotFoundException extends HttpException {
    constructor() {
        super(HTTPStatus.NotFound, "Configuration not found. go to config page.")
    }
}