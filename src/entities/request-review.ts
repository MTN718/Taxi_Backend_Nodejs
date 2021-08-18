import {BaseEntity,Column,Entity,Index,JoinColumn,JoinTable,ManyToMany,ManyToOne,OneToMany,OneToOne,PrimaryColumn,PrimaryGeneratedColumn,RelationId, CreateDateColumn} from "typeorm";
import {Request} from "./request";
import {Driver} from "./driver";
import { TimestampTransformer } from "../models/transformers";


@Entity()
export class RequestReview extends BaseEntity {

    @PrimaryGeneratedColumn()
    id:number;
        

    @Column("smallint",{ 
        nullable:true
    })
    score?:number;
        

    @Column("varchar",{ 
        nullable:true
    })
    review?:string;
        

    @CreateDateColumn({
        type: "timestamp",
        transformer: new TimestampTransformer()
    })
    reviewTimestamp?:Date;
        

    @OneToOne(()=>Request, (travel: Request)=>travel.review,{ onDelete: 'RESTRICT',onUpdate: 'RESTRICT' })
    request?:Request;


    @ManyToOne(()=>Driver, (driver: Driver)=>driver.requestReviews,{ onDelete: 'CASCADE',onUpdate: 'RESTRICT' })
    driver?:Driver;

}
