import {BaseEntity,Column,Entity,ManyToOne,PrimaryGeneratedColumn, CreateDateColumn} from "typeorm";
import {Request} from "./request";
import {ComplaintType} from "./complaint-type";
import { ClientType } from "../models/client-jwt-decoded";
import { TimestampTransformer } from "../models/transformers";


@Entity()
export class Complaint extends BaseEntity {

    @PrimaryGeneratedColumn()
    id:number;
        
    
    @ManyToOne(()=>Request, (request: Request)=>request.complaints,{ onDelete: 'RESTRICT',onUpdate: 'RESTRICT' })
    request?:Request;
    

    @ManyToOne(()=>ComplaintType, (complaint_type: ComplaintType)=>complaint_type.complaints,{ onDelete: 'SET NULL',onUpdate: 'CASCADE' })
    complaintType?:ComplaintType;


    @Column("enum",{
        enum:ClientType
    })
    requestedBy:ClientType;
        

    @Column("varchar",{ 
        nullable:true
    })
    subject?:string;
        

    @Column("varchar",{ 
        nullable:true
    })
    content?:string;
        

    @Column("tinyint",{
        width:1,
        default:0
    })
    isReviewed:boolean;
        

    @CreateDateColumn({
        type: "timestamp",
        transformer: new TimestampTransformer()
    })
    inscriptionTimestamp:Date;
        

    @Column("timestamp",{ 
        nullable:true,
        transformer: new TimestampTransformer()
    })
    reviewTimestamp?:Date;
        
}
