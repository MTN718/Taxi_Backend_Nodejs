import {BaseEntity,Column,Entity,OneToMany,PrimaryGeneratedColumn} from "typeorm";
import {Complaint} from "./complaint";
import { ClientType } from "../models/client-jwt-decoded";


@Entity()
export class ComplaintType extends BaseEntity {

    @PrimaryGeneratedColumn()
    id:number;
        

    @Column("varchar",{ 
        nullable:true
    })
    title?:string;
        

    @Column("enum",{ 
        nullable:true,
        enum:["low","medium","high"],
        name:"importance"
        })
    importance?:string;
        

    @Column("enum",{ 
        nullable:false,
        enum:ClientType
    })
    senderType:string;
        

   
    @OneToMany(()=>Complaint, (complaint: Complaint)=>complaint.complaintType,{ onDelete: 'SET NULL' ,onUpdate: 'CASCADE' })
    complaints:Complaint[];
    
}
