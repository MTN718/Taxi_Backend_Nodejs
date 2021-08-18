export default class CMSException {
    status: CMSErrorStatus;
    message: string;
    constructor(status: CMSErrorStatus, message: string) {
      this.status = status;
      this.message = message;
    }
}

export enum CMSErrorStatus {
  PermissionDenied = "PermissionDenied",
  Unknown = 'Unknown'
}

export class PermissionDeniedException extends CMSException {
    constructor() {
        super(CMSErrorStatus.PermissionDenied, "Permission Denied");
    }
}

export class UnknownException extends CMSException {
    constructor(message: string) {
        super(CMSErrorStatus.Unknown, message);
    }
}