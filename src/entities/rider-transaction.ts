import {BaseEntity,Column,Entity,Index,JoinColumn,JoinTable,ManyToMany,ManyToOne,OneToMany,OneToOne,PrimaryColumn,PrimaryGeneratedColumn,RelationId, CreateDateColumn} from "typeorm";
import {Rider} from "./rider";
import {Operator} from "./operator";
import { Request } from "./request";
import { PaymentGateway, PaymentGatewayType } from "./payment-gateway";
import { TimestampTransformer, ColumnIntTransformer, ColumnFloatTransformer } from "../models/transformers";

export enum TransactionType {
    Cash = 'Cash',
    Bank = 'Bank',
    Gift = 'Gift',
    Commission = 'Commission',
    Travel = 'Travel',
    InApp = 'InApp',
    TransferToBank = 'TransferToBank'
}


@Entity()
export class RiderTransaction extends BaseEntity {

    @PrimaryGeneratedColumn()
    id:number;
        

    @ManyToOne(()=>Rider, (rider: Rider)=>rider.riderTransactions,{ onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
    rider?:Rider;

    @ManyToOne(()=>Request, (request: Request)=>request.riderTransactions,{ onDelete: 'CASCADE', onUpdate: 'NO ACTION' })
    request?:Request;
    
    @ManyToOne(()=>Operator, (operator: Operator)=>operator.riderTransactions,{ onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
    operator?:Operator;

    @CreateDateColumn({
        type: 'timestamp',
        transformer: new TimestampTransformer()
    })
    transactionTime:number;
        

    @Column("enum",{
        nullable: true,
        enum:TransactionType
    })
    transactionType?:TransactionType;

    @ManyToOne(()=>PaymentGateway, paymentGateway => paymentGateway.riderTransactions)
    paymentGateway?:PaymentGateway;

    @Column("float",{
        default:0,
        precision:12,
        transformer: new ColumnFloatTransformer()
    })
    amount:number;

    
    @Column('varchar')
    currency: string;
        

    @Column("varchar",{
        nullable: true
    })
    documentNumber?:string;
        

    @Column("varchar", {
        nullable: true
    })
    details?:string;


    @Column("number")
    requestId?:number;

    @Column("number")
    riderId?:number;
        
}
