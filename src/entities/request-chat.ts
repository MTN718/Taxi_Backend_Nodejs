import {BaseEntity,Column,Entity,ManyToOne,PrimaryGeneratedColumn,CreateDateColumn} from "typeorm";
import {Request} from "./request";
import { ClientType } from "../models/client-jwt-decoded";
import { TimestampTransformer } from "../models/transformers";

export enum MessageState {
    Sent = "sent",
    Delivered = "delivered",
    Seen = "seen"
}

@Entity()
export class RequestChat extends BaseEntity {

    @PrimaryGeneratedColumn()
    id:number;
        

    @CreateDateColumn({
        type: "timestamp",
        transformer: new TimestampTransformer()
    })
    sentAt?:number;
        

    @Column("varchar",{ 
        nullable:true
    })
    content?:string;

    @Column("enum",{
        enum:ClientType
    })
    sentBy:ClientType;
        

    @Column("enum",{ 
        nullable:true,
        default: MessageState.Sent,
        enum:MessageState
    })
    state?:MessageState;
    
   
    @ManyToOne(()=>Request, (travel: Request)=>travel.travelChats,{nullable:false,onDelete: 'RESTRICT',onUpdate: 'RESTRICT' })
    request?:Request;


    
        
}
