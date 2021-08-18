import ExpressController from "./interfaces/express.controller.interface";
import * as express from 'express'
import * as jwt from 'jsonwebtoken'
import { Operator } from "../entities/operator";
import InvalidCredentialsException from "./exceptions/invalid-credentials.exception";
import Container from "typedi";
import Config from "../libs/config";
import multer from "multer";
import { Media } from "../entities/media";
import { FindManyOptions, Between, Like, In, getRepository } from "typeorm";
import { json2csvAsync } from 'json-2-csv';
import { promises as fs } from "fs";
import NotFoundException from "./exceptions/not-found.exception";

const storage = multer.diskStorage({
    destination(req: any, file: Express.Multer.File, callback: (error: Error | null, destination: string) => void) {
        callback(undefined, `${process.cwd()}/public/img/${req.headers.type}`);
    },
    filename(req, file, cb) {
        cb(undefined, `${file.originalname}`);
    }
});
const upload = multer({ storage })

export default class OperatorController implements ExpressController {
    path = "/operator";
    router: express.Router;

    constructor() {
        this.router = express.Router({});
        this.router.post('/login', this.login);
        this.router.post('/upload', upload.any(), this.upload);
        this.router.post('/export', this.export);
    }

    /**
     * Operator can be logged in if there is a registration record according to username/password is found.
     *
     * @param {express.Request} req { user_name: 'x', password: 'y' }
     * @param {express.Response} res Results {token: string, user: User }
     * @param {express.NextFunction} next Error Handler
     * @returns
     * @memberof OperatorController
     */
    async login(req: express.Request, res: express.Response, next: express.NextFunction) {
        const cnf = new Config();
        await cnf.init();
        if(!cnf.isConfiged()) {
            next(new NotFoundException());
            return;
        }
        let operator = await Operator.findOne({where: {userName: req.body.user_name, password: req.body.password}, relations: ['media']})
        if(operator == undefined) {
            next(new InvalidCredentialsException())
            return;
        }
        let token = jwt.sign({ id: operator.id }, Container.get('token'), {});
        const config = new Config();
        await config.init();
        res.json({
            token: token,
            user: operator,
            map: config.settings.googleMaps.dashboard
        });
    }

    /**
     * Updates firebase configuration necessary for both login and notification
     *
     * @param {express.Request} req { riderKey: File, riderDbUrl: string, driverKey: File, driverDbUrl: string }
     * @param {express.Response} res OK usually.
     * @param {express.NextFunction} next
     * @memberof ConfigController
     */
    async upload(req: express.Request, res: express.Response, next: express.NextFunction) {
        let media = await Media.save({address: `img/${req.headers.type}/${req.files[0].filename}`, type: req.headers.type} as Media);
        res.json(media);
    }

    async export(req: express.Request, res: express.Response, next: express.NextFunction) {
        let options: FindManyOptions = {};
            if (req.body.filters) {
                for (let k of Object.keys(req.body.filters)) {
                    if (typeof req.body.filters[k] != 'string')
                        continue;
                    if (req.body.filters[k].includes('^')) {
                        let a = req.body.filters[k].split('^');
                        req.body.filters[k] = Between(a[0], a[1]) as any;
                    } else if (req.body.filters[k].startsWith('%') && req.body.filters[k].endsWith('%')) {
                        req.body.filters[k] = Like(req.body.filters[k]) as any;
                    } else if (req.body.filters[k].includes('|')) {
                        let s = req.body.filters[k].split('|');
                        req.body.filters[k] = In(s);
                    }
                }
                options.where = req.body.filters;
            }
            if (req.body.sort) {
                let _sort = {};
                _sort[req.body.sort.property] = req.body.sort.direction;
                options.order = _sort;
            }
            if(req.body.relations != null) {
                options.relations = req.body.relations;
            }
            let result = (await getRepository(req.body.table).find(options)) as any[];
            if(req.body.type == 'csv') {
                let str = await json2csvAsync(result);
                let fileName = `/public/${new Date().getTime()}.csv`;
                await fs.writeFile(`${process.cwd()}${fileName}`, str);
                res.download(`${process.cwd()}${fileName}`);
            }
    }
}