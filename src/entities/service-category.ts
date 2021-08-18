import {BaseEntity,Column,Entity,OneToMany,PrimaryGeneratedColumn} from "typeorm";
import {Service} from "./service";


@Entity()
export class ServiceCategory extends BaseEntity {

    @PrimaryGeneratedColumn()
    id:number;
        

    @Column('varchar')
    title:string;
        
    @OneToMany(()=>Service, (service: Service)=>service.category)
    services?:Service[];
    
}
