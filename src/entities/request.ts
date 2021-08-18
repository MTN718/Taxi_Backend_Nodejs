import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, CreateDateColumn } from "typeorm";
import { Driver } from "./driver";
import { Rider } from "./rider";
import { Service } from "./service";
import { Complaint } from "./complaint";
import { RequestChat } from "./request-chat";
import { RequestReview } from "./request-review";
import { Operator } from "./operator";
import { MultipointTransformer, TimestampTransformer } from "../models/transformers";
import CoordinateXY from "../models/coordinatexy";
import { Coupon } from "./coupon";
import { RiderTransaction } from "./rider-transaction";
import { DriverTransaction } from "./driver-transaction";
import { AdminTransaction } from "./admin-transaction";
import { FleetTransaction } from "./fleet-transaction";

export enum RequestStatus {
    Requested = 'Requested',
    NotFound = 'NotFound',
    NoCloseFound = 'NoCloseFound',
    Found = 'Found',
    DriverAccepted = 'PhysioAccepted',
    Arrived = 'Arrived',
    WaitingForPrePay = 'WaitingForPrePay',
    DriverCanceled = 'Physio Cancelled',
    RiderCanceled = 'Patient Cancelled',
    Started = 'Started',
    WaitingForPostPay = 'WaitingForPostPay',
    WaitingForReview = 'WaitingForReview',
    Finished = 'Finished',
    Booked = 'Booked',
    Expired = 'Expired'
}

export enum RequestLabel {
    None = 'none',
    Blue = 'blue',
    Red = 'red',
    Green = 'green',
    Yellow = 'yellow',
    Purple = 'purple'
}

@Entity()
export class Request extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column("int", {
        nullable: true
    })
    driverId?: number;

    @Column("int", {
        nullable: true
    })
    riderId?: number;


    @ManyToOne(() => Driver, (driver: Driver) => driver.requests, { onDelete: 'SET NULL', onUpdate: 'CASCADE' })
    driver?: Driver;



    @ManyToOne(() => Rider, (rider: Rider) => rider.requests, { onDelete: 'SET NULL', onUpdate: 'CASCADE' })
    rider?: Rider;


    @Column("enum", {
        nullable: true,
        default: RequestStatus.Requested,
        enum: RequestStatus
    })
    status?: RequestStatus;


    @Column("varchar", {
        transformer: {
            to(value: string[]): string {
                return value.join('|');
            },
            from(value: string): string[] {
                return value.split('|');
            }
        },
        length: 500
    })
    addresses?: string[];

    @Column("multipoint", {
        transformer: new MultipointTransformer()
    })
    points?: CoordinateXY[];


    @Column("int", {
        default: 0
    })
    distanceBest?: number;


    @Column("int", {
        default: 0
    })
    durationBest?: number;


    @Column("float", {
        precision: 10,
        scale: 2
    })
    costBest?: number;


    @Column("int", {
        default: 0
    })
    durationReal?: number;


    @Column("int", {
        default: 0
    })
    distanceReal?: number;


    @Column("float", {
        default: 0,
        precision: 12
    })
    cost?: number;


    @Column("int", {
        nullable: true
    })
    rating?: number;

    @CreateDateColumn({
        type: "timestamp",
        transformer: new TimestampTransformer()
    })
    requestTimestamp?: number;

    @Column("timestamp", {
        nullable: true,
        transformer: new TimestampTransformer()
    })
    etaPickup?: number;

    @Column("timestamp", {
        nullable: true,
        transformer: new TimestampTransformer()
    })
    expectedTimestamp?: number;


    @Column("timestamp", {
        nullable: true,
        transformer: new TimestampTransformer()
    })
    startTimestamp?: number;


    @Column("timestamp", {
        nullable: true,
        transformer: new TimestampTransformer()
    })
    finishTimestamp?: number;


    @Column('varchar', {
        nullable: true,
        length:6000
    })
    log?: string;

    @Column('enum', {
        enum: RequestLabel,
        default: RequestLabel.None
    })
    label?: RequestLabel;

    @Column('varchar')
    currency: string;

    @Column("tinyint", {
        width: 1,
        default: 0
    })
    isHidden?: boolean;


    @Column("float", {
        nullable: true,
        precision: 10,
        default: 0,
        scale: 2
    })
    costAfterCoupon?: number;

    @Column("float", {
        nullable: false,
        default: 0,
        precision: 10,
        scale: 2
    })
    paidAmount?: number;


    @Column("int", {
        nullable: true
    })
    confirmationCode?: number;


    @ManyToOne(() => Coupon, (coupon: Coupon) => coupon.requests, { onDelete: 'CASCADE', onUpdate: 'NO ACTION' })
    coupon?: Coupon;

    @ManyToOne(() => Service, (service: Service) => service.requests, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
    service?: Service;

    @ManyToOne(() => Operator, (operator: Operator) => operator.requests, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
    operator?: Operator;

    @OneToMany(() => Complaint, (complaint: Complaint) => complaint.request, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
    complaints?: Complaint[];


    @OneToMany(() => RequestChat, (travel_chat: RequestChat) => travel_chat.request, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
    travelChats?: RequestChat[];


    @OneToOne(() => RequestReview, (review: RequestReview) => review.request, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
    @JoinColumn()
    review?: RequestReview;

    @OneToMany(() => RiderTransaction, (riderTransactions: RiderTransaction) => riderTransactions.request, { onDelete: 'CASCADE', onUpdate: 'NO ACTION' })
    riderTransactions: RiderTransaction[];

    @OneToMany(() => DriverTransaction, (driverTransaction: DriverTransaction) => driverTransaction.request, { onDelete: 'CASCADE', onUpdate: 'NO ACTION' })
    driverTransactions: DriverTransaction[];

    @OneToMany(() => AdminTransaction, reverse => reverse.request, { onDelete: 'CASCADE', onUpdate: 'NO ACTION' })
    adminTransactions: AdminTransaction[];

    @OneToMany(() => FleetTransaction, reverse => reverse.request, { onDelete: 'CASCADE', onUpdate: 'NO ACTION' })
    fleetTransactions: FleetTransaction[];
}
