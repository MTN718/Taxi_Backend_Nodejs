import {BaseEntity,Column,Entity,Index,JoinColumn,JoinTable,ManyToMany,ManyToOne,OneToMany,OneToOne,PrimaryColumn,PrimaryGeneratedColumn,RelationId} from "typeorm";
import {Rider} from "./rider";
import CoordinateXY from "../models/coordinatexy";


@Entity()
export class RiderAddress extends BaseEntity {

    @PrimaryGeneratedColumn()
    id:number;
        
    
    @ManyToOne(()=>Rider, (rider: Rider)=>rider.riderAddresss,{ onDelete: 'RESTRICT',onUpdate: 'RESTRICT' })
    rider?:Rider;


    @Column("varchar")
    title?:string;
        

    @Column("varchar")
    address?:string;
        

    @Column("point", {
        transformer: {
            to(value: CoordinateXY): string {
                return `POINT(${value.x} ${value.y})`
            },
            from(value: string): CoordinateXY {
                return {
                    x: parseFloat(value.substring(6).split(' ')[0]),
                    y: parseFloat(value.substring(6).split(' ')[1])
                }
            }
        }
    })
    location?:CoordinateXY;
        
}
