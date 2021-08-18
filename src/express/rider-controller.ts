import * as jwt from 'jsonwebtoken'
import * as express from 'express'
import { Rider, RiderStatus } from "../entities/rider";
import ExpressController from './interfaces/express.controller.interface';
import Container from 'typedi';
import { app } from 'firebase-admin';
import ClientJWTDecoded, { ClientType } from '../models/client-jwt-decoded';
import InvalidCredentialsException from './exceptions/invalid-credentials.exception';


export default class RiderController implements ExpressController {
    path = '/rider';
    public router: express.Router;

    constructor() {
        this.router = express.Router({});
        this.router.post('/login', this.loginRoute);
    }

    /**
     * Logging in for rider
     *
     * @param {express.Request} req { token }, token being firebaseGenerated token.
     * @param {express.Response} res {user: Rider, token: string } token being App generated jwt token
     * @param {express.NextFunction} next Error handler
     * @returns
     * @memberof RiderController
     */
    async loginRoute(req: express.Request, res: express.Response, next: express.NextFunction) {
        const decodedToken = await (Container.get('firebase.rider') as app.App).auth().verifyIdToken(req.body.token);
        let number = parseInt((decodedToken.firebase.identities.phone[0] as string).substring(1));
        let profile = await Rider.findOne({where: {mobileNumber: number}, relations: ['media']});
        console.log(profile);
        if(profile == null) {
            let rawId = (await Rider.insert({mobileNumber: number})).raw.insertId;
            profile  = await Rider.findOne(rawId);
        }
        switch (profile.status) {
            case (RiderStatus.Blocked):
                next(new InvalidCredentialsException());
        }
        let keys: ClientJWTDecoded = {
            id: profile.id,
            t: ClientType.Rider
        };
        let token = jwt.sign(keys, Container.get('token'), {});
        res.json({ user:profile, token: token });
    }
}