import ExpressApplication from "..";
import Config from "../../libs/config";
import express from 'express'
import request from 'supertest';
import DriverController from "../driver-controller";
import RiderController from "../rider-controller";
import OperatorController from "../operator-controller";

let app: express.Express

beforeAll(async () => {
    let config = new Config().settings
    app = (new ExpressApplication([
        new DriverController(),
        new RiderController(),
        new OperatorController()
    ])).app
})

describe('rider', () => {
    it("should login", async () => {
        
    })
})

// a helper function to make a POST request.
export function post(url, body){
    const httpRequest = request(app).post(url);
    httpRequest.send(body);
    httpRequest.set('Accept', 'application/json')
    httpRequest.set('Origin', 'http://localhost:3000')
    return httpRequest;
}