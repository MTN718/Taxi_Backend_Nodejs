import ConfigController from "../config-controller";
import * as httpMocks from "node-mocks-http";
import * as express from 'express'


describe.skip('MySQL', () => {
    let config = new ConfigController();
    it.skip('correct details returns 200', async () => {
        var request  = httpMocks.createRequest({
            method: 'POST',
            url: '/driver/login',
            body: {
              host: 'localhost',
              user: 'root',
              password: 'defaultpassword'
            }
        });
        var response = httpMocks.createResponse()
        await config.updateMySql(request, response, null)
        expect(response.statusCode).toBe(200)
    });
    it.skip('correct details fails', async () => {
        var request  = httpMocks.createRequest({
            body: {
              host: 'localhost2',
              user: 'root',
              password: 'defaultpassword'
            }
        });
        var response = httpMocks.createResponse()
        const next = jest.fn() as unknown as express.NextFunction
        await config.updateMySql(request, response, next)
        expect(next).toBeCalled()
    });
});