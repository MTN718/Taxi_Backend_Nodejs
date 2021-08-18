import ExpressController from "./interfaces/express.controller.interface";

import Config from '../libs/config';
import { Operator } from "../entities/operator";
import InvalidCredentialsException from "./exceptions/invalid-credentials.exception";
import * as express from 'express'
import rp from 'request-promise-any';
import mysql from 'mysql2/promise';
import UnknownException from "./exceptions/unknown.exception";
import multer from 'multer';

const storage = multer.diskStorage({
    destination(req: any, file: Express.Multer.File, callback: (error: Error | null, destination: string) => void) {
        callback(undefined, `${process.cwd()}/config`);
    },
    filename(req, file, cb) {
        cb(undefined, `${file.originalname}`);
    }
});
const upload = multer({ storage })

export default class ConfigController implements ExpressController {
    path = '/config'
    router: import("express").Router;

    constructor() {
        this.router = express.Router({});
        this.router.post('/get', this.get);
        this.router.get('/is_configed', this.isConfiged);
        this.router.post('/update_purchase', this.updatePurchaseCode);
        this.router.post('/disable_one', this.disableOne);
        this.router.post('/update_sql', this.updateMySql);
        this.router.post('/update_maps', this.updateGoogleMaps);
        this.router.post('/update_firebase', upload.any(), this.updateFirebase);
        this.router.post('/upload_firebase', upload.any(), this.uploadFirebase);
    }

    /**
     * Get Current configuration information
     *
     * @param {Express.Request} req If configuration should be admin user password.
     * @param {Express.Response} res Returns whole configuration file as it is.
     * @memberof ConfigController
     */
    async get(req: express.Request, res: express.Response, next: express.NextFunction) {
        const config = new Config();
        await config.init();
        if (config.isConfiged()) {
            let op = await Operator.findOne({ where: { userName: 'admin', password: req.body.pass } });
            if (op == undefined) {
                next(new InvalidCredentialsException())
                return;
            }
        }
        res.json(config.settings);

    }
    /**
     *Disable one of previous servers
     *
     * @param {express.Request} req { ip: String }
     * @param {express.Response} res
     * @memberof ConfigController
     */
    async disableOne(req: express.Request, res: express.Response) {
        let result = await rp({ uri: `http://31.220.15.49:9000/disable_one`, qs: { ip: req.body.ip }, headers: { 'User-Agent': 'node.js' }, json: true });
        res.json(result)
    }

    async isConfiged(req: express.Request, res: express.Response) {
        const config = new Config();
        await config.init();
        res.send(config.isConfiged());
    }

    /**
     * Validates purchase code with server and if valid saves it.
     *
     * @param {express.Request} req body should have purchase code only.
     * @param {express.Response} res Three possible outcomes: 1-200 2-300 with ip address of previous servers to disable. 3-An exception thrown
     * @param {express.NextFunction} next
     * @memberof ConfigController
     */
    async updatePurchaseCode(req: express.Request, res: express.Response, next: express.NextFunction) {
        let result = await rp({ uri: `http://31.220.15.49:9000/verify?purchaseCode=${req.body.code}&port=${process.env.MAIN_PORT}`, headers: { 'User-Agent': 'node.js' }, json: true });
        if (result.status == 'OK') {
            const config = new Config();
            await config.init();
            config.settings.purchaseCode = req.body.code;
            config.save();
            res.json({});
        } else if (result.status == 'USED') {
            res.status(300).json({ clients: result.clients });
        } else {
            next(new InvalidCredentialsException());
        }
    }


    /**
     * Updates mysql configuration
     *
     * @param {express.Request} req { host: x, user: y, password: z, port: s, database: d }
     * @param {express.Response} res If it can connect it would create database and send OK back.
     * @param {express.NextFunction} next
     * @memberof ConfigController
     */
    async updateMySql(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            let rescon = await mysql.createConnection({ host: process.env.NODE_ENV == 'docker' ? 'mysql' : req.body.host, user: process.env.NODE_ENV == 'docker' ? 'root' : req.body.user, port: process.env.NODE_ENV == 'docker' ? 3306 : req.body.port, password: process.env.NODE_ENV == 'docker' ? 'defaultpassword' : req.body.password })
            await rescon.query(`CREATE DATABASE IF NOT EXISTS ${process.env.NODE_ENV == 'docker' ? 'taxi_docker' : req.body.database} CHARACTER SET utf8mb4`, []);
            const config = new Config();
            await config.init();
            config.settings.mysql = {
                host: req.body.host,
                user: req.body.user,
                port: parseInt(req.body.port),
                password: req.body.password,
                database: req.body.database
            }
            config.save();
            res.json({});
        } catch (exception) {
            console.log(exception);
            next(new UnknownException(exception.message));
        }
    }

    /**
     * Update Google services API key
     *
     * @param {express.Request} req body should be just api key in string.
     * @param {express.Response} res 200 if ok. exception if not.
     * @param {express.NextFunction} next exception handler.
     * @memberof ConfigController
     */
    async updateGoogleMaps(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const config = new Config();
            await config.init();
            config.settings.googleMaps = {
                backend: req.body.key,
                dashboard: req.body.dashboard
            };
            config.save();
            res.json({});
        } catch (exception) {
            next(new UnknownException(exception.message));
        }
    }

    /**
     * Updates firebase configuration necessary for both login and notification
     *
     * @param {express.Request} req { riderKey: File, riderDbUrl: string, driverKey: File, driverDbUrl: string }
     * @param {express.Response} res OK usually.
     * @param {express.NextFunction} next
     * @memberof ConfigController
     */
    async updateFirebase(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const config = new Config();
            await config.init();
            config.settings.firebase = req.body;
            config.settings.version = 2;
            await config.save();
            res.json({});
            process.exit(0)
        } catch (exception) {
            next(new UnknownException(exception.message));
        }
    }

    /**
     * Updates firebase configuration necessary for both login and notification
     *
     * @param {express.Request} req { riderKey: File, riderDbUrl: string, driverKey: File, driverDbUrl: string }
     * @param {express.Response} res OK usually.
     * @param {express.NextFunction} next
     * @memberof ConfigController
     */
    async uploadFirebase(req: express.Request, res: express.Response, next: express.NextFunction) {
        res.json({});
    }
}