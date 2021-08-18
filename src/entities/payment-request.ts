import {BaseEntity,Column,Entity,Index,JoinColumn,JoinTable,ManyToMany,ManyToOne,OneToMany,OneToOne,PrimaryColumn,PrimaryGeneratedColumn,RelationId, CreateDateColumn} from "typeorm";
import {Driver} from "./driver";
import { TimestampTransformer } from "../models/transformers";

export enum PaymenRequestStatus {
    Pending = 'Pending',
    Paid = 'Paid',
    Rejected = 'Rejected'
}

@Entity()
export class PaymentRequest extends BaseEntity {

    @PrimaryGeneratedColumn()
    id:number;
        
   
    @ManyToOne(()=>Driver, (driver: Driver)=>driver.paymentRequests,{ onDelete: 'CASCADE',onUpdate: 'RESTRICT' })
    driver?:Driver;


    @CreateDateColumn({
        type: "timestamp",
        transformer: new TimestampTransformer()
    })
    requestTimestamp:Date;
        

    @Column("timestamp",{ 
        nullable:true,
        transformer: new TimestampTransformer()
    })
    paymentTimestamp?:Date;
        
    
    @Column("varchar",{ 
        nullable:true
    })
    accountNumber?:string;
        

    @Column("enum",{ 
        nullable:true,
        default: PaymenRequestStatus.Pending,
        enum:PaymenRequestStatus
    })
    status?:PaymenRequestStatus;
        

    @Column("varchar",{ 
        nullable:true
    })
    comment?:string;
        
}
