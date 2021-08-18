import * as express from 'express'
import * as jwt from 'jsonwebtoken'
import { getConnection } from 'typeorm';
import { Driver, DriverStatus } from '../entities/driver';
import ExpressController from './interfaces/express.controller.interface'
import HardRejectException from './exceptions/hard-reject.exception';
import { Service } from '../entities/service';
import multer = require('multer');
import { MediaType, Media } from '../entities/media';
import UnknownException from './exceptions/unknown.exception'
import InvalidCredentialsException from './exceptions/invalid-credentials.exception';
import { app } from 'firebase-admin';
import Container from 'typedi';
import Redis from '../libs/redis/redis';
import { Request } from '../entities/request';
import ClientJWTDecoded, { ClientType } from '../models/client-jwt-decoded';
import { Complaint } from '../entities/complaint';
import CMSNamespace from '../socket/cms-namespace';

const storage = multer.diskStorage({
    destination(req: any, file: Express.Multer.File, callback: (error: Error | null, destination: string) => void) {
        const address = `${process.cwd()}/public/img/${req.headers.type}`;
        console.log(`trying to upload into: ${address}`);
        callback(undefined, address);
    },
    filename(req, file, cb) {
      cb(undefined, `${Date.now()}.${file.originalname.split('.').pop()}`);
    }
  });
const upload = multer({ storage })

export default class DriverController implements ExpressController {
    path = "/driver"
    router: express.Router;

    constructor() {
        this.router = express.Router({});
        this.router.post('/upload', upload.single('file'), this.uploadFile);
        this.router.post('/login', this.login);
        this.router.post('/register', this.register);
        this.router.post('/get', this.get);
        this.router.post('/update_location', this.updateLocation);
    }

    /**
     * Logins with firebase Auth Id Token as input. Returns JWT & profile if user is valid
     *
     * @param {express.Request} req In { token: 'x' } x being Firebase Id Token
     * @param {express.Response} res { user: Driver, token: 'y' } y being in app jwt token
     * @param {express.NextFunction} next Error handler
     * @returns
     * @memberof DriverController
     */
    async login(req: express.Request, res: express.Response, next: express.NextFunction) {
        const decodedToken = await (Container.get('firebase.driver') as app.App).auth().verifyIdToken(req.body.token);
        let number = parseInt((decodedToken.firebase.identities.phone[0] as string).substring(1));
        let profile = await Driver.findOne({where: {mobileNumber: number}, relations: ['media']});
        if(profile == null) {
            let id = (await Driver.insert({mobileNumber: number})).raw.insertId;
            profile = await Driver.findOne(id);
        }
        let keys: ClientJWTDecoded = {
            id: profile.id,
            t: ClientType.Driver
        };
        let token = jwt.sign(keys, Container.get('token'), {});
        switch (profile.status) {
            case (DriverStatus.Blocked):
            case (DriverStatus.HardReject):
                next(new HardRejectException(profile.documentsNote));
                break;
                
            default:
                res.json({ user: profile, token: token });
        }
    }

    /**
     * Takes firebase token & driver info and returns jwt token signed
     *
     * @param {express.Request} req in body there should be { token : 'x', driver: Driver } x being firebase Id Token
     * @param {express.Response} res returns { token: 'y' } y being app signed jwt token
     * @param {express.NextFunction} next in case Token is not valid
     * @memberof DriverController
     */
    async register(req: express.Request, res: express.Response, next: express.NextFunction) {
        let decoded: any = jwt.verify(req.body.token, Container.get('token'));
        let profile = await Driver.findOne(decoded.id);
        if(profile == null) {
            next(new InvalidCredentialsException());
            return;
        }
        let driver: Driver = req.body.driver;
        driver.status = DriverStatus.PendingApproval;
        await Driver.save(driver);
        res.sendStatus(200);
    }

    /**
     * Gets Driver's registration Info.
     *
     * @param {express.Request} req In { token: 'x' } x being App verified JWT Token
     * @param {express.Response} res Return { driver: Driver, services?: Service[] } services only included when driver is not yet approved
     * @param {express.NextFunction} next Error Handler
     * @returns
     * @memberof DriverController
     */
    async get(req: express.Request, res: express.Response, next: express.NextFunction) {
        let decoded: any = jwt.verify(req.body.token, Container.get('token'))
        let driver = await Driver.findOne({where: {id: decoded.id}, relations: ['documents', 'media']})
        if(driver == null) {
            next(new InvalidCredentialsException());
            return;
        }
        if(driver.status == DriverStatus.WaitingDocuments || driver.status == DriverStatus.PendingApproval || driver.status == DriverStatus.SoftReject) {
            let services = await Service.find({relations: ['media']});
            res.json({ driver: driver, services: services });
        } else {
            res.json({ driver: driver });
        }
    }

    /**
     *
     *
     * @param {express.Request} req { token, location, inTravel }
     * @param {express.Response} res Status code only
     * @memberof DriverController
     */
    async updateLocation(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            let decoded: any = jwt.decode(req.body.token, Container.get('token'));
            Container.get(Redis).driver.setCoordinate(decoded.id, req.body.location);
            if(req.body.inTravel) {
                let request = await Request.findOne({ where: { driver: { id: decoded.id } }, order: { id: 'DESC' }, loadRelationIds: true });
                (Container.get('io') as any).of('/riders').to(Container.get('riders')[request.rider as unknown as number]).emit('updateLocation', req.body.location);
            } else {
                (Container.get('io') as any).of('/cms').emit('driverLocationUpdated', {id: decoded.id, loc: {lat: req.body.location.y, lng: req.body.location.x}});
            }
            res.sendStatus(200);
        } catch(exception) {
            next(new UnknownException(exception));
        }
    }

    async uploadFile(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            let address = `img/${req.headers.type}/${req.file.filename}`;
            console.log(`uploaded: ${address}`);
            let driver = await Driver.findOne({ where: { mobileNumber: req.headers['number'] }, relations: ['documents'] });
            switch(req.headers['type']) {
                case('document'): {
                    let media = await Media.insert({ type: MediaType.Document, address: address });
                    await getConnection().createQueryBuilder().relation(Driver, "documents").of(driver).add({id: media.raw.insertId});
                    break;
                }

                case('driver image'): {
                    let media = await Media.insert({ type: MediaType.DriverImage, address: address });
                    driver.media = await Media.findOne(media.raw.insertId);
                    await Driver.save(driver);
                    break;
                }
                case('driver header'):
                //await getRepository(Driver).update(driver.id, { media: { type: MediaType.DriverImage, address: address}})
                break;
            }
            res.send(address)
        } catch (error) {
            console.log(`error on upload: ${error}`);
            next(new UnknownException(`upload file ${error}`))
        }
    }
}