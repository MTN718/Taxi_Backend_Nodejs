import {BaseEntity,Column,Entity,Index,JoinColumn,JoinTable,ManyToMany,ManyToOne,OneToMany,OneToOne,PrimaryColumn,PrimaryGeneratedColumn,RelationId} from "typeorm";
import {Rider} from "./rider";
import {Driver} from "./driver";
import CoordinateXY from "../models/coordinatexy";


@Entity()
export class RiderFavDriver extends BaseEntity {

    @PrimaryGeneratedColumn()
    id:number;
        
    
    @Column("int", {
        nullable: true
    })
    riderId?: number;


    @Column("int", {
        nullable: true
    })
    driverId?: number;


}
