import { BaseEntity, Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Service } from "./service";
import { Request } from "./request";
import { TimestampTransformer, BooleanTransformer } from "../models/transformers";
import { Rider } from "./rider";


@Entity()
export class Coupon extends BaseEntity {

    @PrimaryGeneratedColumn()
    id:number;
        

    @Column("varchar",{ 
        nullable:true
    })
    title?:string;
        

    @Column("varchar",{ 
        nullable:true
    })
    description?:string;
        

    @Column("varchar",{
        unique: true
    })
    code:string;
        

    @Column("int",{
        default:0
    })
    manyUsersCanUse:number;
        

    @Column("int",{
        default:1
    })
    manyTimesUserCanUse:number;
        

    @Column("float",{
        default: '0.00',
        precision:10,
        scale:2
    })
    minimumCost:number;
        

    @Column("float",{
        default: '0.00',
        precision:10,
        scale:2
    })
    maximumCost:number;
        

    @Column("timestamp",{
        nullable: true,
        transformer: new TimestampTransformer()
    })
    startTimestamp?:number;
        

    @Column("timestamp",{
        nullable: true,
        transformer: new TimestampTransformer()
    })
    expirationTimestamp?:number;
        

    @Column("tinyint",{
        default:0
    })
    discountPercent:number;
        

    @Column("float",{
        default: 0,
        precision:10,
        scale:2
    })
    discountFlat:number;
        

    @Column("float",{
        default: 0,
        precision:10,
        scale:2
    })
    creditGift:number;
        

    @Column("tinyint",{
        width:1,
        default:1,
        transformer: new BooleanTransformer()
    })
    isEnabled:boolean;
        

    @Column("tinyint",{
        width:1,
        default:false,
        transformer: new BooleanTransformer()
    })
    isFirstTravelOnly:boolean;
        
   
    @ManyToMany(()=>Service)
    @JoinTable()
    services:Service[];

    @ManyToMany(()=>Rider, rider => rider.coupons)
    riders:Rider[];

    @OneToMany(()=>Request, (request: Request)=>request.coupon, { onDelete: 'CASCADE' ,onUpdate: 'NO ACTION' })
    requests?:Request[];
}
