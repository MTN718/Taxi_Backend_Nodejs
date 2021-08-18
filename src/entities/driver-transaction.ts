import {BaseEntity,Column,Entity,Index,JoinColumn,JoinTable,ManyToMany,ManyToOne,OneToMany,OneToOne,PrimaryColumn,PrimaryGeneratedColumn,RelationId, CreateDateColumn} from "typeorm";
import {Driver} from "./driver";
import {Operator} from "./operator";
import { TransactionType } from "./rider-transaction";
import { Request } from "./request";
import { PaymentGateway } from "./payment-gateway";
import { TimestampTransformer, ColumnFloatTransformer } from "../models/transformers";


@Entity()
export class DriverTransaction extends BaseEntity {

    @PrimaryGeneratedColumn()
    id:number;
        
    
    @ManyToOne(()=>Driver, (driver: Driver)=>driver.transactions,{ onDelete: 'CASCADE',onUpdate: 'RESTRICT' })
    driver?:Driver;


    @ManyToOne(()=>Request, (request: Request)=>request.driverTransactions,{ onDelete: 'CASCADE', onUpdate: 'NO ACTION' })
    request?:Request;

   
    @ManyToOne(()=>Operator, (operator: Operator)=>operator.driverTransactions,{ onDelete: 'RESTRICT',onUpdate: 'RESTRICT' })
    operator?:Operator;


    @CreateDateColumn({
        type: "timestamp",
        transformer: new TimestampTransformer()
    })
    transactionTime:number;
        

    @Column("enum",{ 
        nullable:true,
        enum:TransactionType
    })
    transactionType?:TransactionType;
        

    @Column("float",{
        default:0,
        precision:12,
        transformer: new ColumnFloatTransformer()
    })
    amount:number;

    @ManyToOne(()=>PaymentGateway, paymentGateway => paymentGateway.driverTransactions)
    paymentGateway?:PaymentGateway;

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
        
}
