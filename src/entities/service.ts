import { BaseEntity, Column, Entity, Index, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryColumn, PrimaryGeneratedColumn, RelationId } from "typeorm";
import { ServiceCategory } from "./service-category";
import { Request } from "./request";
import { Region } from "./region";
import { ColumnFloatTransformer, BooleanTransformer, ColumnIntTransformer } from "../models/transformers";
import { Media } from "./media";
import { Coupon } from "./coupon";

export enum DistanceFee {
    None = 'None',
    PickupToDestination = 'PickupToDestination'
}

export enum FeeEstimationMode {
    Static = 'Static',
    Dynamic = 'Dynamic',
    Ranged = 'Ranged',
    RangedStrict = 'RangedStrict',
    Disabled = 'Disabled'
}

export enum PaymentMethod {
    CashCredit = 'CashCredit',
    OnlyCredit = 'OnlyCredit',
    OnlyCash = 'OnlyCash'
}

export enum PaymentTime {
    PrePay = 'PrePay',
    PostPay = 'PostPay'
}

export enum QuantityMode {
    Singular = 'Singular',
    Multiple = 'Multiple'
}

export enum BookingMode {
    OnlyNow = "OnlyNow",
    Time = "Time",
    DateTime = "DateTime",
    DateTimeAbosoluteHour = "DateTimeAbosoluteHour"
}

@Entity()
export class Service extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;


    @ManyToOne(() => ServiceCategory, (serviceCategory: ServiceCategory) => serviceCategory.services, { onDelete: 'CASCADE' })
    category?: ServiceCategory;


    @Column("varchar", {
        nullable: true
    })
    title?: string;


    @ManyToOne(() => Media, (media: Media) => media.services, { onDelete: 'SET NULL', onUpdate: 'CASCADE' })
    media?: Media;

    @ManyToMany(() => Coupon, coupon => coupon.services)
    coupons?: Coupon[]

    @Column("float", {
        default: '0.00',
        precision: 12,
        scale: 2,
        transformer: new ColumnFloatTransformer()
    })
    baseFare: number;


    @Column('enum', {
        enum: DistanceFee,
        default: DistanceFee.PickupToDestination
    })
    distanceFeeMode: DistanceFee;


    @Column("float", {
        default: '0.00',
        precision: 12,
        scale: 2,
        transformer: new ColumnFloatTransformer()
    })
    perHundredMeters: number;


    @Column("float", {
        default: '0.00',
        precision: 12,
        scale: 2,
        transformer: new ColumnFloatTransformer()
    })
    perMinuteWait: number;


    @Column("float", {
        default: '0.00',
        precision: 12,
        scale: 2,
        transformer: new ColumnFloatTransformer()
    })
    perMinuteDrive?: number;


    @Column("time", {
        default: '00:00'
    })
    availableTimeFrom: string;


    @Column("time", {
        default: '23:59'
    })
    availableTimeTo: string;


    @Column("enum", {
        enum: FeeEstimationMode,
        default: FeeEstimationMode.Static
    })
    feeEstimationMode: FeeEstimationMode;


    @Column("tinyint", {
        width: 1,
        default: false,
        transformer: new BooleanTransformer()
    })
    canEnableVerificationCode: boolean;


    @Column("tinyint", {
        default: 0
    })
    providerSharePercent: number;

    @Column({
        type: 'float',
        default: '0.00',
        precision: 10,
        scale: 2
    })
    providerShareFlat: number;


    @Column({
        type: 'enum',
        enum: PaymentMethod,
        default: PaymentMethod.CashCredit
    })
    paymentMethod: PaymentMethod;


    @Column("enum", {
        enum: PaymentTime,
        default: PaymentTime.PostPay
    })
    paymentTime: PaymentTime;


    @Column("tinyint", {
        default: 0
    })
    prePayPercent: number;

    @Column('int', {
        default: 10000,
        transformer: new ColumnIntTransformer()
    })
    searchRadius: number;

    @Column('int', {
        default: 0,
        transformer: new ColumnIntTransformer()
    })
    maxDestinationDistance: number;


    @Column("tinyint", {
        default: 0
    })
    rangePlusPercent: number;


    @Column("tinyint", {
        default: 0
    })
    rangeMinusPercent: number;


    @Column('enum', {
        enum: QuantityMode,
        default: QuantityMode.Singular
    })
    quantityMode: QuantityMode;

    @Column('enum', {
        enum: BookingMode,
        default: BookingMode.DateTime
    })
    bookingMode: BookingMode;

    @Column("float", {
        default: '0.00',
        precision: 10,
        scale: 2,
        transformer: new ColumnFloatTransformer()
    })
    eachQuantityFee: number;

    @Column('float', {
        default: '0.00',
        precision: 10,
        scale: 2,
        transformer: new ColumnFloatTransformer()
    })
    minimumFee: number;

    @Column('tinyint', {
        nullable: false,
        default: 0
    })
    maxQuantity: number;


    @ManyToMany(() => Region, region => region.services)
    @JoinTable()
    regions: Region[];


    @OneToMany(() => Request, (request: Request) => request.service, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
    requests: Request[];

    calculateCost(distance: number, duration: number, count: number): number {
        let i = this.baseFare;
        if (this.distanceFeeMode == DistanceFee.PickupToDestination) {
            i += (this.perHundredMeters * distance / 100) + (this.perMinuteDrive * duration / 60);
        }
        if (this.quantityMode == QuantityMode.Multiple) {
            i += (this.eachQuantityFee * count);
        }
        if (i < this.minimumFee) {
            i = this.minimumFee;
        }
        return i;
    }
}
