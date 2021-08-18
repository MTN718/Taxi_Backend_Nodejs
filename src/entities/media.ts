import {BaseEntity,Column,Entity,Index,JoinColumn,JoinTable,ManyToMany,ManyToOne,OneToMany,OneToOne,PrimaryColumn,PrimaryGeneratedColumn,RelationId} from "typeorm";
import {Car} from "./car";
import {Operator} from "./operator";
import {Promotion} from "./promotion";
import {Rider} from "./rider";
import { Driver } from "./driver";
import { Service } from "./service";

export enum MediaType {
    Car = 'car',
    Service = 'service',
    DriverImage = 'driver image',
    DriverHeader = 'driver header',
    OperatorImage = 'operator image',
    RiderImage = 'rider image',
    Promotion = 'promotion',
    Document = 'document'
}

export enum PathType {
    Relative = 'relative',
    Absolute = 'absolute'
}

export enum MediaPrivacyLevel {
    Low = 'low',
    Medium = 'medium',
    High = 'high'
}

@Entity()
export class Media extends BaseEntity {

    @PrimaryGeneratedColumn()
    id:number;
        

    @Column("varchar",{ 
        nullable:true
    })
    title?:string;
        

    @Column("varchar",{ 
        nullable:true
    })
    address?:string;
        

    @Column("enum",{ 
        nullable:true,
        enum:MediaType
    })
    type?:MediaType;
        

    @Column("enum",{
        default: MediaPrivacyLevel.Low,
        enum:MediaPrivacyLevel
    })
    privacyLevel?:MediaPrivacyLevel;
        

    @Column("enum",{
        default: PathType.Relative,
        enum:PathType
    })
    pathType:PathType;
        

    @Column("longtext",{ 
        nullable:true,
        name:"base64"
        })
    base64?:string;
        

   
    @OneToMany(()=>Car, (car: Car)=>car.media,{ onDelete: 'RESTRICT' ,onUpdate: 'CASCADE' })
    cars:Car[];
   
    @OneToMany(()=>Driver, (driver: Driver)=>driver.carMedia,{ onDelete: 'RESTRICT' ,onUpdate: 'RESTRICT' })
    drivers:Driver[];

   
    @OneToMany(()=>Driver, (driver: Driver)=>driver.media,{ onDelete: 'SET NULL' ,onUpdate: 'CASCADE' })
    drivers2:Driver[];
    
   
    @OneToMany(()=>Operator, (operator: Operator)=>operator.media,{ onDelete: 'RESTRICT' ,onUpdate: 'RESTRICT' })
    operators:Operator[];
    

   
    @OneToMany(()=>Promotion, (promotion: Promotion)=>promotion.media,{ onDelete: 'RESTRICT' ,onUpdate: 'RESTRICT' })
    promotions:Promotion[];
    

   
    @OneToMany(()=>Rider, (rider: Rider)=>rider.media,{ onDelete: 'RESTRICT' ,onUpdate: 'RESTRICT' })
    riders:Rider[];
    

   
    @OneToMany(()=>Rider, (rider: Rider)=>rider.media,{ onDelete: 'RESTRICT' ,onUpdate: 'RESTRICT' })
    riders2:Rider[];

    @OneToMany(()=>Service, (service: Service)=>service.media,{ onDelete: 'RESTRICT' ,onUpdate: 'RESTRICT' })
    services:Service[];
    
}
