import {BaseEntity,Column,Entity,Index,JoinColumn,JoinTable,ManyToMany,ManyToOne,OneToMany,OneToOne,PrimaryColumn,PrimaryGeneratedColumn,RelationId} from "typeorm";
import {Operator} from "./operator";


@Entity()
export class OperatorToDo extends BaseEntity {

    @PrimaryGeneratedColumn()
    id:number;
        
   
    @ManyToOne(()=>Operator, (operator: Operator)=>operator.operatorTodos,{ onDelete: 'RESTRICT',onUpdate: 'RESTRICT' })
    operator?:Operator;


    @Column("varchar",{ 
        nullable:true
    })
    title?:string;
        

    @Column("tinyint",{ 
        nullable:true,
        width:1,
        default:0
    })
    isDone?:boolean;
        
}
