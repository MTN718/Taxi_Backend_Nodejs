import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, Column, BaseEntity } from "typeorm";
import { Operator } from "./operator";
import { Driver } from "./driver";
import { Request } from "./request";
import { Fleet } from "./fleet";
import { TimestampTransformer, ColumnFloatTransformer } from "../models/transformers";

export enum FleetTransactionType {
    Commission = "Commission",
    Withdraw = "Withdraw"
}

@Entity()
export class FleetTransaction extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn({
        type: "timestamp",
        transformer: new TimestampTransformer()
    })
    transactionTime:number;

    @Column("enum",{ 
        nullable:true,
        enum:FleetTransactionType
    })
    transactionType?:FleetTransactionType;

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


    @ManyToOne(()=>Fleet, (fleet: Fleet)=>fleet.transactions,{ onDelete: 'CASCADE',onUpdate: 'RESTRICT' })
    fleet?:Fleet;
    
    @ManyToOne(()=>Driver, (driver: Driver)=>driver.transactions,{ onDelete: 'CASCADE',onUpdate: 'RESTRICT' })
    driver?:Driver;

    @ManyToOne(()=>Request, (request: Request)=>request.fleetTransactions, { onDelete: 'CASCADE', onUpdate: 'NO ACTION' })
    request?:Request;
   
    @ManyToOne(()=>Operator, (operator: Operator)=>operator.driverTransactions,{ onDelete: 'RESTRICT',onUpdate: 'RESTRICT' })
    operator?:Operator;
}