import { BaseEntity, Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { ColumnFloatTransformer } from "../models/transformers";

@Entity()
export class AdminWallet extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('decimal',{
        default: 0,
        precision:13,
        scale:2,
        transformer: new ColumnFloatTransformer()
    })
    amount: number;

    @Column('varchar')
    currency: string;

    static async addToWallet(amount: number, cuurency: string): Promise<AdminWallet> {
        let wItem: any = await AdminWallet.findOne({currency: cuurency});
        if(wItem == null) {
            wItem = {amount: amount, currency: cuurency};
            let insert = await AdminWallet.insert({amount: amount, currency: cuurency});
            wItem['id'] = insert.raw.insertId;
        } else {
            await AdminWallet.update(wItem.id, {amount: amount + wItem.amount});
            wItem.amount += amount;
        }
        return wItem;
    }
}