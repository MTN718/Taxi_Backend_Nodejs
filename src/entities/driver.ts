import { BaseEntity, Column, ManyToOne, OneToMany, PrimaryGeneratedColumn, Entity, ManyToMany, JoinTable } from "typeorm";
import { Car } from "./car";
import { Media } from "./media";
import { DriverTransaction } from "./driver-transaction";
import { PaymentRequest } from "./payment-request";
import { Request } from "./request";
import { RequestReview } from "./request-review";
import { Gender } from "../models/enums/enums";
import { StringToIntTransformer } from "../models/coordinatexy";
import { Service } from "./service";
import { DriverToGateway } from "./driver-to-gateway";
import { DriverWallet } from "./driver-wallet";
import { Fleet } from "./fleet";
import { TimestampTransformer } from "../models/transformers";


export enum DriverStatus {
    Online = 'online',
    Offline = 'offline',
    Blocked = 'blocked',
    InService = 'in service',
    WaitingDocuments = 'waiting documents',
    PendingApproval = 'pending approval',
    SoftReject = 'soft reject',
    HardReject = 'hard reject',
}

@Entity()
export class Driver extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;


    @Column("varchar", {
        nullable: true
    })
    firstName?: string;


    @Column("varchar", {
        nullable: true
    })
    lastName?: string;


    @Column("varchar", {
        nullable: true
    })
    certificateNumber?: string;


    @Column("bigint", {
        nullable: true,
        unique: true,
        transformer: new StringToIntTransformer()
    })
    mobileNumber?: number;


    @Column("varchar", {
        nullable: true
    })
    email?: string;


    @OneToMany(() => DriverWallet, wallet => wallet.driver)
    wallet: DriverWallet[];

    @ManyToOne(() => Car, (car: Car) => car.drivers, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
    car?: Car;

    @ManyToOne(() => Fleet, (fleet: Fleet) => fleet.operators)
    fleet?: Fleet;


    @Column("varchar", {
        nullable: true
    })
    carColor?: string;


    @Column("int", {
        nullable: true
    })
    carProductionYear?: number;

    @Column("varchar", {
        nullable: true
    })
    carPlate?: string;


    @ManyToOne(() => Media, (media: Media) => media.drivers, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
    carMedia?: Media;


    @Column("enum", {
        default: DriverStatus.WaitingDocuments,
        enum: DriverStatus
    })
    status: DriverStatus;


    @Column("smallint", {
        nullable: true,
    })
    rating?: number;


    @Column("smallint", {
        default: 0
    })
    reviewCount: number;



    @ManyToOne(() => Media, (media: Media) => media.drivers2, { onDelete: 'SET NULL', onUpdate: 'CASCADE' })
    media?: Media;


    @Column("enum", {
        default: Gender.Unknown,
        enum: Gender
    })
    gender: Gender;

    @Column("timestamp", {
        default: () => "CURRENT_TIMESTAMP"
    })
    registrationTimestamp: Date;

    @Column("timestamp", {
        nullable: true,
        transformer: new TimestampTransformer()
    })
    lastSeenTimestamp?: number;

    @Column("varchar", {
        nullable: true
    })
    accountNumber?: string;

    @Column('varchar', {
        nullable: true
    })
    bankName: string;

    @Column("varchar", {
        nullable: true
    })
    bankRoutingNumber?: string;

    @Column("varchar", {
        nullable: true
    })
    bankSwift?: string;


    @Column("varchar", {
        nullable: true
    })
    address?: string;


    @Column("tinyint", {
        width: 1,
        default: 0
    })
    infoChanged: boolean;


    @Column("varchar", {
        nullable: true
    })
    notificationPlayerId?: string;


    @Column("varchar", {
        nullable: true
    })
    documentsNote?: string;



    @ManyToMany(() => Media)
    @JoinTable()
    documents: Media[];


    @OneToMany(() => DriverTransaction, (driver_transaction: DriverTransaction) => driver_transaction.driver, { onDelete: 'CASCADE', onUpdate: 'RESTRICT' })
    transactions: DriverTransaction[];



    @OneToMany(() => PaymentRequest, (payment_request: PaymentRequest) => payment_request.driver, { onDelete: 'CASCADE', onUpdate: 'RESTRICT' })
    paymentRequests: PaymentRequest[];


    @OneToMany(() => Request, (travel: Request) => travel.driver, { onDelete: 'SET NULL', onUpdate: 'CASCADE' })
    requests: Request[];


    @OneToMany(() => RequestReview, (requestReview: RequestReview) => requestReview.driver, { onDelete: 'CASCADE', onUpdate: 'RESTRICT' })
    requestReviews: RequestReview[];

    @ManyToMany(() => Service)
    @JoinTable()
    services: Service[];

    @OneToMany(() => DriverToGateway, driverToGateway => driverToGateway.driver)
    gatewayIds?: DriverToGateway[];

    async addToWallet(amount: number, cuurrency: string): Promise<DriverWallet> {
        let driver = await Driver.findOne(this.id, { relations: ['wallet'] });
        let wItem: any = driver.wallet.find(x => x.currency == cuurrency);
        if (wItem == null) {
            wItem = { amount: amount, currency: cuurrency };
            let insert = await DriverWallet.insert({ amount: amount, currency: cuurrency, driver: { id: this.id } });
            wItem['id'] = insert.raw.insertId;
        } else {
            await DriverWallet.update(wItem.id, { amount: amount + wItem.amount });
            wItem.amount += amount;
        }
        return wItem;
    }
}
