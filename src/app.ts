console.time('init');
import 'reflect-metadata';
import * as http from 'http';
import socket from 'socket.io';
import rp from 'request-promise-any';
import { promises as fs } from 'fs';
import ExpressApplication from './express'
require('dotenv').config();
import Redis from './libs/redis/redis';
import Notifier from './libs/notifier/notifier';
import GeoLib from './libs/geo';
import Config from './libs/config';
import DriverController from './express/driver-controller';
import RiderController from './express/rider-controller';
import OperatorController from './express/operator-controller';
import Container from 'typedi';
import { createConnection, Not } from 'typeorm';
import admin from 'firebase-admin';
import { MediaType } from './entities/media';
import AdminNamespace from './socket/admin-namespace';
import DriverNamespace from './socket/driver-namespace';
import RiderNamespace from './socket/rider-namespace';
import ConfigController from './express/config-controller';
import CMSNamespace from './socket/cms-namespace';
import { Stats } from './models/stats';
import { Complaint } from './entities/complaint';
import { PaymentRequest, PaymenRequestStatus } from './entities/payment-request';
import { Driver, DriverStatus } from './entities/driver';
import { default as replace, replaceInFile } from "replace-in-file";

const config = new Config();
config.init().then(async x => {
    if(!config.isConfiged()) {
        const app = new ExpressApplication([
            new ConfigController(),
            new OperatorController()
        ]);
        let server = http.createServer(app.app);
        console.log(process.env.MAIN_PORT);
        server.listen(process.env.MAIN_PORT, function () {
            console.timeEnd('init')
            console.log(`Started up on config mode ${process.env.MAIN_PORT}`);
        });
    } else {

        // let regex = new RegExp('api/js\\?key=.*?(?=&)');
        // await replaceInFile({
        //     files: `${process.cwd()}/public/index.html`,
        //     from: regex,
        //     to: `api/js?key=${config.settings.googleMaps.dashboard}`
        // });
        // let regex2 = new RegExp('window.mAPI=".*?(?=;)');
        // await replaceInFile({
        //     files: `${process.cwd()}/public/index.html`,
        //     from: regex2,
        //     to: `window.mAPI="${config.settings.googleMaps.dashboard}"`
        // });
        // for (let mediaType of Object.values(MediaType)) {
        //     await fs.mkdir(`${process.cwd()}/public/img/${mediaType}`, { recursive: true});
        // }
        const dbName = process.env.NODE_ENV == 'docker' ? 'taxi_docker' : config.settings.mysql.database;
        const cn = await createConnection({
            name: 'cs',
            type: 'mysql',
            host: process.env.NODE_ENV == 'docker' ? 'mysql' : config.settings.mysql.host,
            port: process.env.NODE_ENV == 'docker' ? 3306 : config.settings.mysql.port,
            username: process.env.NODE_ENV == 'docker' ? 'root' : config.settings.mysql.user,
            password: process.env.NODE_ENV == 'docker' ? 'defaultpassword' : config.settings.mysql.password
        });
        await cn.query(`CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4`);
        await createConnection({
            type: "mysql",
            host: process.env.NODE_ENV == 'docker' ? 'mysql' : config.settings.mysql.host,
            port: process.env.NODE_ENV == 'docker' ? 3306 : config.settings.mysql.port,
            username: process.env.NODE_ENV == 'docker' ? 'root' : config.settings.mysql.user,
            password: process.env.NODE_ENV == 'docker' ? 'defaultpassword' : config.settings.mysql.password,
            database: dbName,
            synchronize: true,
            migrationsRun: true,
            legacySpatialSupport: false,
            cli:{
                entitiesDir:'src/entities',
                migrationsDir:'src/entities',
                subscribersDir:'src/entities'
            },
            entities: [`${__dirname}/entities/*.js`],
            migrations: [`${__dirname}/migration/*.js`],
            subscribers: [`${__dirname}/subscribers/*.js`]
            // entities: ["./src/entities/*.ts", "./dist/entities/*.js"],
            // migrations: ["./src/migration/*.ts", "./dist/migration/*.js"],
            // subscribers: ["./src/subscribers/*.ts", "./dist/subscribers/*.js"]
        });
        Container.set('token', "1234");
        Container.set('firebase.driver', admin.initializeApp({
            credential: admin.credential.cert(require(`${process.cwd()}/config/${config.settings.firebase.driver.keyFile}`)),
            databaseURL: config.settings.firebase.driver.dbUrl
        },'driver'));
        Container.set('firebase.rider', admin.initializeApp({
            credential: admin.credential.cert(require(`${process.cwd()}/config/${config.settings.firebase.rider.keyFile}`)),
            databaseURL: config.settings.firebase.rider.dbUrl
        },'rider'));
        Container.set(Notifier, new Notifier());
        Container.set(Redis, new Redis(config.settings.redis));
        Container.set(GeoLib, new GeoLib(config.settings.googleMaps.backend));
        Container.set('drivers', {});
        Container.set('riders', {});
        let stats = new Stats();
        stats.complaints = await Complaint.count({ where: {isReviewed: false}});
        stats.paymentRequests = await PaymentRequest.count({ where: { status: Not(PaymenRequestStatus.Paid) } });
        stats.driversPending = await Driver.count({ where: { status: DriverStatus.PendingApproval }});
        stats.inServiceDrivers = await Driver.count({ where: { status: DriverStatus.InService }});
        stats.availableDrivers = await Driver.count({ where: { status: DriverStatus.Online }});
        Container.set(Stats, stats);
        const app = new ExpressApplication([
            new DriverController(),
            new RiderController(),
            new OperatorController(),
            new ConfigController()
        ]);
        let server = http.createServer(app.app);
        const io = socket.listen(server);
        Container.set('io', io);
        Container.set(CMSNamespace, new CMSNamespace());
        new AdminNamespace();
        new DriverNamespace();
        new RiderNamespace();
        server.listen(process.env.MAIN_PORT, function () {
            console.timeEnd('init')
            console.log(`Location: ${process.cwd()}`)
            console.log(`Listening on ${process.env.MAIN_PORT}`);
        });



        // rp({ uri: `http://31.220.15.49:9000/verify?purchaseCode=${config.settings.purchaseCode}&port=${process.env.MAIN_PORT}`, headers: { 'User-Agent': 'app' }, json: true }).then(async function (result) {
        //     console.log('result' + result.status);
        //     if (result.status === "OK") {
                
        //     } else {
        //         console.log(result.message);
        //     }
        // });
    }
})

process.on('unhandledRejection', r => {
    console.log(r)
});