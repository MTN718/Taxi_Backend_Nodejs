import { Entity, PrimaryGeneratedColumn, Column, OneToMany, BaseEntity } from "typeorm";
import { ColumnFloatTransformer } from "../models/transformers";
import { Operator } from "./operator";
import { Driver } from "./driver";
import { FleetTransaction } from "./fleet-transaction";
import { FleetWallet } from "./fleet-wallet";

@Entity()
export class Fleet extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar')
    name: string;

    @Column('tinyint', {
        default: 0
    })
    commissionSharePercent: number;

    @Column('bigint')
    mobileNumber?: number;

    @Column('bigint')
    phoneNumber?: number;

    @Column('varchar')
    accountNumber: string;

    @Column('varchar', {
        nullable: true
    })
    address: string;

    @OneToMany(() => Operator, (operator: Operator) => operator.fleet)
    operators: Operator[];

    @OneToMany(() => Driver, (driver: Driver) => driver.fleet)
    drivers: Driver[];

    @OneToMany(() => FleetWallet, (wallet: FleetWallet) => wallet.fleet)
    wallet: FleetWallet[];

    @OneToMany(() => FleetTransaction, (transaction: FleetTransaction) => transaction.fleet)
    transactions: FleetTransaction[];

    async addToWallet(amount: number, cuurrency: string): Promise<FleetWallet> {
        let item = await Fleet.findOne(this.id, {relations: ['wallet']});
        let wItem: any = item.wallet.find(x=>x.currency == cuurrency);
        if(wItem == null) {
            wItem = {amount: amount, currency: cuurrency};
            let insert = await FleetWallet.insert({amount: amount, currency: cuurrency, fleet: {id: this.id}});
            wItem['id'] = insert.raw.insertId;
        } else {
            await FleetWallet.update(wItem.id, {amount: amount + wItem.amount});
            wItem.amount += amount;
        }
        return wItem;
    }
}