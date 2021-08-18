import {BaseEntity,Column,Entity,Index,JoinColumn,JoinTable,ManyToMany,ManyToOne,OneToMany,OneToOne,PrimaryColumn,PrimaryGeneratedColumn,RelationId} from "typeorm";
import {Operator} from "./operator";

export enum ReminderImportance {
    Low = 'low',
    Medium = 'medium',
    High = 'high'
}

@Entity()
export class OperatorReminder extends BaseEntity {

    @PrimaryGeneratedColumn()
    id:number;
        

    @ManyToOne(()=>Operator, (operator: Operator)=>operator.operatorReminders,{ onDelete: 'RESTRICT',onUpdate: 'RESTRICT' })
    operator:Operator;


    @Column("varchar",{ 
        nullable:true
    })
    title?:string;
        

    @Column("timestamp",{ 
        nullable:true
    })
    due?:string;
        

    @Column("enum",{
        default: ReminderImportance.Medium,
        enum:ReminderImportance
    })
    importance:ReminderImportance;
}
