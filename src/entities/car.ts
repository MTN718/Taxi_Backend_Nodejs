import {BaseEntity,Column,Entity,Index,JoinColumn,JoinTable,ManyToMany,ManyToOne,OneToMany,OneToOne,PrimaryColumn,PrimaryGeneratedColumn,RelationId} from "typeorm";
import {Media} from "./media";
import {Driver} from "./driver";


@Entity()
export class Car extends BaseEntity {

    @PrimaryGeneratedColumn()
    id:number;
        

    @Column("varchar",{ 
        nullable:true
    })
    title?:string;
        

   
    @ManyToOne(()=>Media, (media: Media)=>media.cars,{ onDelete: 'RESTRICT',onUpdate: 'CASCADE' })
    media?:Media;


   
    @OneToMany(()=>Driver, (driver: Driver)=>driver.car,{ onDelete: 'RESTRICT' ,onUpdate: 'RESTRICT' })
    drivers:Driver[];
    
}
