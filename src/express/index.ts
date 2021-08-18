import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import cors from 'cors';
import ExpressController from './interfaces/express.controller.interface';
import errorMiddleware from './middlewares/error.middleware';
import { PaymentGateway } from '../entities/payment-gateway';
import { Stripe } from 'stripe';

const allowedExt = ['.js', '.ico', '.css', '.png', '.jpg', '.woff2', '.woff', '.ttf', '.svg', '.zip', '.webp'];

export default class ExpressApplication {
    public app: express.Express

    constructor(contollers: ExpressController[]) {
        this.app = express();
        this.initializeMiddlewares();
        this.initializeControllers(contollers);
        this.app.get('/restart', async function (req, res) {
            res.json('server Restarted');
            process.exit(0)
        })

        this.initializeErrorHandler();
        this.app.get('*', (req, res) => {
            if (allowedExt.filter(ext => req.url.indexOf(ext) > 0).length > 0) {
                res.sendFile(path.resolve(`public/${req.url}`));
              } else {
                res.sendFile(path.resolve('public/index.html'));
              }
        });
        this.app.post('/stripe_client_secret', async (req, res) => {
            let gw = await PaymentGateway.findOne(req.body.gatewayId);
            let stripe = new Stripe(gw.privateKey, {apiVersion: null});
            let pI = await stripe.paymentIntents.create({
                amount: req.body.amount,
                currency: req.body.currency
            });
            res.json({clientSecret: pI.client_secret});
        })
    }

    initializeMiddlewares() {
        this.app.enable('trust proxy');
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));        
        var corsOptions = {
            origin: true,
            credentials:true,
            preflightContinue: true
          }
        this.app.use(cors(corsOptions));
        this.app.use(express.static(`${process.cwd()}/public`));
    }

    initializeControllers(controllers: ExpressController[]) {
        controllers.forEach(controller => {
            this.app.use(controller.path, controller.router)
        });
    }
    
    initializeErrorHandler() {
        this.app.use(errorMiddleware)
    }



}