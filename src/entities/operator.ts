import {BaseEntity,Column,Entity,Index,JoinColumn,JoinTable,ManyToMany,ManyToOne,OneToMany,OneToOne,PrimaryColumn,PrimaryGeneratedColumn,RelationId} from "typeorm";
import {Media} from "./media";
import {DriverTransaction} from "./driver-transaction";
import {OperatorReminder} from "./operator-reminder";
import {OperatorToDo} from "./operator-todo";
import {RiderTransaction} from "./rider-transaction";
import { Request } from "./request";
import { Fleet } from "./fleet";

export enum  PermissionDefault {
    View = 'view',
    Update = 'update',
    Delete = 'delete'
}

@Entity()
export class Operator extends BaseEntity {

    @PrimaryGeneratedColumn()
    id:number;
        

    @Column("varchar", {
        nullable: true
    })
    firstName?:string;
        

    @Column("varchar", {
        nullable: true
    })
    lastName?:string;
        
    @ManyToOne(()=>Media, (media: Media)=>media.operators,{ onDelete: 'RESTRICT',onUpdate: 'RESTRICT' })
    media?:Media;


    @Column("varchar",{
        unique: true
    })
    userName:string;
        

    @Column("varchar", {
        default: ''
    })
    password?:string;
        

    @Column("bigint", {
        nullable: true
    })
    mobileNumber?:string;
        

    @Column("bigint", {
        nullable: true
    })
    phoneNumber?:string;
        

    @Column("varchar", {
        nullable: true
    })
    address?:string;
        

    @Column("set", {
        enum: PermissionDefault,
        default: [PermissionDefault.View,PermissionDefault.Update]
    })
    permissionOperator?:PermissionDefault[];
        

    @Column("set",{ 
        nullable:true,
        enum: PermissionDefault,
        default: [PermissionDefault.View, PermissionDefault.Update, PermissionDefault.Delete]
    })
    permissionDriver?:PermissionDefault[];
        

    @Column("set",{ 
        nullable:true,
        enum: PermissionDefault,
        default: [PermissionDefault.View, PermissionDefault.Update, PermissionDefault.Delete]
    })
    permissionRider?: PermissionDefault[];
    

    @Column("set",{ 
        nullable:true,
        enum: PermissionDefault,
        default: [PermissionDefault.View, PermissionDefault.Update, PermissionDefault.Delete],
    })
    permissionTravel?: PermissionDefault[];
        

    @Column("set",{ 
        nullable:true,
        enum: PermissionDefault,
        default: [PermissionDefault.View, PermissionDefault.Update, PermissionDefault.Delete]
    })
    permissionComplaint?: PermissionDefault[];
        

    @Column("set",{ 
        nullable:true,
        enum: PermissionDefault,
        default: [PermissionDefault.View, PermissionDefault.Update, PermissionDefault.Delete]
    })
    permissionPaymentRequest?: PermissionDefault[];

    @Column("set",{ 
        nullable:true,
        enum: PermissionDefault,
        default: [PermissionDefault.View, PermissionDefault.Update, PermissionDefault.Delete]
    })
    permissionPaymentGateway?: PermissionDefault[];
        

    @Column("set",{ 
        nullable:true,
        enum: PermissionDefault,
        default: [PermissionDefault.View, PermissionDefault.Update, PermissionDefault.Delete]
    })
    permissionLibrary?:PermissionDefault;
        

    @Column("enum",{
        default: 'enabled',
        enum:["enabled","disabled","updated"]
    })
    status:string;
        

    @Column("set",{ 
        nullable:true,
        enum: PermissionDefault,
        default: [PermissionDefault.View, PermissionDefault.Update, PermissionDefault.Delete],
    })
    permissionCar?: PermissionDefault[];
        

    @Column("set",{ 
        nullable:true,
        enum: PermissionDefault,
        default: [PermissionDefault.View, PermissionDefault.Update, PermissionDefault.Delete]
    })
    permissionService?: PermissionDefault[];
        

    @Column("set",{
        enum: PermissionDefault,
        default: [PermissionDefault.View, PermissionDefault.Update, PermissionDefault.Delete]
    })
    permissionRegion?: PermissionDefault[];

    @ManyToOne(() => Fleet, (fleet: Fleet) => fleet.operators)
    fleet?: Fleet;
        
    @OneToMany(() => Request, (request: Request) => request.operator, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
    requests: Request[];    

    @OneToMany(()=>DriverTransaction, (driver_transaction: DriverTransaction)=>driver_transaction.operator,{ onDelete: 'RESTRICT' ,onUpdate: 'RESTRICT' })
    driverTransactions:DriverTransaction[];
    
    @OneToMany(()=>OperatorReminder, (operator_reminder: OperatorReminder)=>operator_reminder.operator,{ onDelete: 'RESTRICT' ,onUpdate: 'RESTRICT' })
    operatorReminders:OperatorReminder[];
    

   
    @OneToMany(()=>OperatorToDo, (operator_todo: OperatorToDo)=>operator_todo.operator,{ onDelete: 'RESTRICT' ,onUpdate: 'RESTRICT' })
    operatorTodos:OperatorToDo[];
    

   
    @OneToMany(()=>RiderTransaction, (rider_transaction: RiderTransaction)=>rider_transaction.operator,{ onDelete: 'RESTRICT' ,onUpdate: 'RESTRICT' })
    riderTransactions:RiderTransaction[];
    
}
