import DriverController from "../driver-controller"
import * as express from 'express'
import { Driver } from "../../entities/driver";
import * as httpMocks from "node-mocks-http";
import admin = require("firebase-admin");
import Container from "typedi";

let route: DriverController
beforeAll(() => {
    Container.set('firebase.driver', jest.fn().mockReturnValue({
        auth: jest.fn().mockReturnValue({
            verifyIdToken: jest.fn().mockReturnValue({
                firebase: {
                    identities: {
                        phone_number: '1'
                    }
                }
            })
        })
    })) 
    route = new DriverController()
})
describe.skip('Login', () => {
    it('Correct credentials logins', async () => {
        //Driver.findOne = jest.fn().mockReturnValue(_driver)
        var request  = httpMocks.createRequest({
            method: 'POST',
            url: '/driver/login',
            body: {
              user_name: '1'
            }
        });
        var response = httpMocks.createResponse()
        await route.login(request, response, null)
        var data = response._getJSONData()
        expect(data.token).toBeDefined()
    })

    it('Incorrect credentials fails', async () => {
        Driver.findOne = jest.fn().mockReturnValue(undefined)
        var request  = httpMocks.createRequest({
            method: 'POST',
            url: '/driver/login',
            body: {
              user_name: '1'
            }
        })
        var response = httpMocks.createResponse()
        const next = jest.fn() as unknown as express.NextFunction
        await route.login(request, response, next)
        expect(next).toBeCalledTimes(1)
    })
    it('Hard rejected throws exception', async () => {
        //Driver.findOne = jest.fn().mockReturnValue(_driverHardRejected)
        var request  = httpMocks.createRequest({
            method: 'POST',
            url: '/driver/login',
            body: {
              user_name: '1'
            }
        });
        var response = httpMocks.createResponse()
        const next = jest.fn() as unknown as express.NextFunction;
        await route.login(request, response, next)
        expect(next).toBeCalledTimes(1)
    })
})

describe.skip('Register', () => {
    test('New driver with correct token registers', async () => {
        Driver.findOne = jest.fn().mockReturnValue(undefined)
        Driver.insert = jest.fn().mockReturnValue({
            identifiers: {
                insertId: 1
            }
        })
        var request  = httpMocks.createRequest({
            method: 'POST',
            url: '/driver/register',
            body: {
              //driver: _driver,
              token: 'token'
            }
        });
        var response = httpMocks.createResponse()
        const next = jest.fn() as unknown as express.NextFunction;
        await route.register(request, response, next)
        let res = response._getJSONData()
        expect(res.token).toBeDefined()
    })

    test('Already registered driver with correct token registers', async () => {
        //Driver.findOne = jest.fn().mockReturnValue(_driver)
        /*Driver.update = jest.fn()
        var request  = httpMocks.createRequest({
            method: 'POST',
            url: '/driver/register',
            body: {
              //driver: _driver,
              token: 'token'
            }
        });
        var response = httpMocks.createResponse()
        const next = jest.fn() as unknown as express.NextFunction;
        await route.register(request, response, next)
        let res = response._getJSONData()
        expect(res.token).toBeDefined()*/
    })
})