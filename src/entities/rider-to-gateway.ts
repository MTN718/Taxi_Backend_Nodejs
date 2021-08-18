import {BaseEntity,Column,Entity,Index,JoinColumn,JoinTable,ManyToMany,ManyToOne,OneToMany,OneToOne,PrimaryColumn,PrimaryGeneratedColumn,RelationId, CreateDateColumn} from "typeorm";
import { PaymentGateway } from "./payment-gateway";
import { Rider } from "./rider";

@Entity()
export class RiderToGateway extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(type => Rider, rider => rider.gatewayIds)
    rider: Rider;

    @ManyToOne(type => PaymentGateway, gateway => gateway.riderToGateways)
    gateway: PaymentGateway;

    @Column()
    customerId: string;
}