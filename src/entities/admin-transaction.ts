import { PrimaryGeneratedColumn, Entity, CreateDateColumn, Column, ManyToOne, BaseEntity } from "typeorm";
import { TimestampTransformer, ColumnFloatTransformer } from "../models/transformers";
import { FleetTransactionType } from "./fleet-transaction";
import { Fleet } from "./fleet";
import { Operator } from "./operator";
import { Driver } from "./driver";
import { Request } from "./request";
import { PaymentGateway } from "./payment-gateway";

export enum AdminTransactionType {
    Commission = "Commission",
    Withdraw = "Withdraw"
}

@Entity()
export class AdminTransaction extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn({
        type: "timestamp",
        transformer: new TimestampTransformer()
    })
    transactionTime:number;

    @Column("enum",{ 
        nullable:true,
        enum:AdminTransactionType
    })
    transactionType?:AdminTransactionType;

    @Column("float",{
        default:0,
        precision:12,
        transformer: new ColumnFloatTransformer()
    })
    amount:number;

    @Column('varchar', {
        length: 5
    })
    currency: string;
        
    @Column("varchar",{ 
        nullable:true
    })
    documentNumber?:string;

    @Column("varchar",{ 
        nullable:true
    })
    details?:string;

    @ManyToOne(()=>PaymentGateway, (gateway: PaymentGateway)=>gateway.adminTransactions, { onDelete: 'CASCADE', onUpdate: 'NO ACTION' })
    paymentGateway?:PaymentGateway;

    @ManyToOne(()=>Request, (request: Request)=>request.adminTransactions, { onDelete: 'CASCADE', onUpdate: 'NO ACTION' })
    request?:Request;
   
    @ManyToOne(()=>Operator, (operator: Operator)=>operator.driverTransactions, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
    operator?:Operator;
}