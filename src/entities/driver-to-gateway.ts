import {BaseEntity,Column,Entity,ManyToOne,PrimaryGeneratedColumn} from "typeorm";
import { PaymentGateway } from "./payment-gateway";
import { Driver } from "./driver";

@Entity()
export class DriverToGateway extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Driver, driver => driver.gatewayIds)
    driver: Driver;

    @ManyToOne(() => PaymentGateway, gateway => gateway.driverToGateways)
    gateway: PaymentGateway;

    @Column('varchar')
    customerId: string;
}