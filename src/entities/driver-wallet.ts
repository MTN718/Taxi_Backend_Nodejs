import {BaseEntity,Column,Entity,ManyToOne,PrimaryGeneratedColumn} from "typeorm";
import { Driver } from "./driver";
import { ColumnFloatTransformer } from "../models/transformers";

@Entity()
export class DriverWallet extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Driver, driver => driver.wallet)
    driver!: Driver;

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