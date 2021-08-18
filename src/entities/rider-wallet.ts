import {BaseEntity,Column,Entity,ManyToOne,PrimaryGeneratedColumn} from "typeorm";
import { ColumnFloatTransformer } from "../models/transformers";
import { Rider } from "./rider";

@Entity()
export class RiderWallet extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Rider, rider => rider.wallet)
    rider!: Rider;

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