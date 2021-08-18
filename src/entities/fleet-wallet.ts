import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, BaseEntity } from "typeorm";
import { Fleet } from "./fleet";
import { ColumnFloatTransformer } from "../models/transformers";

@Entity()
export class FleetWallet extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Fleet, (fleet: Fleet) => fleet.wallet)
    fleet: Fleet;

    @Column('decimal',{
        default: 0,
        precision:13,
        scale:2,
        transformer: new ColumnFloatTransformer()
    })
    amount: number;

    @Column('varchar')
    currency: string;

}