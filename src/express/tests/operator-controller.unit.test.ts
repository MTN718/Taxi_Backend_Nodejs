import * as httpMocks from "node-mocks-http"
import * as express from 'express'
import OperatorController from "../operator-controller"
import { Operator } from "../../entities/operator"
import { _operator } from "../../test/operator.mock"
import Container from "typedi"

let route: OperatorController

beforeAll(async() => {
    route = new OperatorController()
    Container.set('token', 'thetoken')
})

test('login', async () => {
    Operator.findOne = jest.fn().mockReturnValue(_operator)
    var request  = httpMocks.createRequest({
        method: 'POST',
        url: '/operator/login',
        body: {
          user_name: '1'
        }
    });
    var response = httpMocks.createResponse()
    const next = jest.fn() as unknown as express.NextFunction
    await route.login(request, response, next)
    let res = response._getJSONData()
    expect(res.token).toBeDefined()

})