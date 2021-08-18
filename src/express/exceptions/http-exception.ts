export default class HttpException extends Error {
    status: HTTPStatus;
    message: string;
    constructor(status: HTTPStatus, message: string) {
      super(message);
      this.status = status;
      this.message = message;
    }
}

export enum HTTPStatus {
  InvalidCredentials = 403,
  HardReject = 411,
  NotFound = 404,
  Unknown = 666
}