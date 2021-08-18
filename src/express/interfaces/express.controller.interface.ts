import { Router } from "express";

export default interface ExpressController {
    path: string;
    router: Router;
  }