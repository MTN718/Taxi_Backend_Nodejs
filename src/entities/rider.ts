import {BaseEntity,Column,Entity,Index,JoinColumn,JoinTable,ManyToMany,ManyToOne,OneToMany,OneToOne,PrimaryColumn,PrimaryGeneratedColumn,RelationId, CreateDateColumn} from 'typeorm';
import {Media} from './media';
import {RiderAddress} from './rider-address';
import {RiderTransaction} from './rider-transaction';
import {Request} from './request';
import { Gender } from '../models/enums/enums';
import { Coupon } from './coupon';
import { ColumnIntTransformer, ColumnFloatTransformer, TimestampTransformer, DefaultTimestampTransformer } from '../models/transformers';
import { RiderToGateway } from './rider-to-gateway';
import { RiderWallet } from './rider-wallet';

export enum RiderStatus {
    Enabled = 'enabled',
    Blocked = 'blocked'
}

@Entity()
export class Rider extends BaseEntity {

    @PrimaryGeneratedColumn()
    id:number;
        

    @Column('varchar', {
        nullable: true
    })
    firstName?:string;
        

    @Column('varchar', {
        nullable: true
    })
    lastName?:string;
        

    @Column('bigint',{
        unique: true,
        transformer: new ColumnIntTransformer()
    })
    mobileNumber?:number;
        

    @Column('enum',{
        default: RiderStatus.Enabled,
        enum:RiderStatus
    })
    status: RiderStatus;
        
        
    @CreateDateColumn({
        type: 'timestamp',
        transformer: new DefaultTimestampTransformer()
    })
    registrationTimestamp: number;
        

    @Column({
        type: 'timestamp',
        nullable: true
    })
    birthTimestamp?: Date;

    @Column({
        nullable: true
    })
    vaultId?: string;

    @Column({
        nullable: true
    })
    cvc?: string;        

   
    @ManyToOne(()=>Media, (media: Media)=>media.riders,{ onDelete: 'RESTRICT',onUpdate: 'RESTRICT' })
    media?:Media;



    @Column('varchar', {
        nullable: true
    })
    email?:string;
        

    @Column('enum',{
        default: Gender.Unknown,
        enum:Gender
    })
    gender:Gender;
        

   
    @ManyToOne(()=>Rider, (rider: Rider)=>rider.riders,{ onDelete: 'RESTRICT',onUpdate: 'RESTRICT' })
    referrer?:Rider;


    @OneToMany(()=>RiderWallet, wallet => wallet.rider)
    wallet: RiderWallet[];
        
    @Column({
        type: 'varchar',
        nullable: true
    })
    address?:string;
        

    @Column('tinyint', {
        width:1,
        default:0
    })
    infoChanged:boolean;
        

    @Column({
        type: 'varchar',
        nullable: true
    })
    notificationPlayerId?:string;


    @OneToMany(()=>Rider, (rider: Rider)=>rider.referrer,{ onDelete: 'RESTRICT' ,onUpdate: 'RESTRICT' })
    riders:Rider[];
    

   
    @OneToMany(()=>RiderAddress, (rider_address: RiderAddress)=>rider_address.rider,{ onDelete: 'RESTRICT' ,onUpdate: 'RESTRICT' })
    riderAddresss:RiderAddress[];


    @ManyToMany(()=>Coupon, coupon => coupon.riders)
    @JoinTable()
    coupons:Coupon[];
    
   
    @OneToMany(()=>RiderTransaction, (rider_transaction: RiderTransaction)=>rider_transaction.rider,{ onDelete: 'RESTRICT' ,onUpdate: 'RESTRICT' })
    riderTransactions:RiderTransaction[];
    

    @OneToMany(() => RiderToGateway, riderGateway => riderGateway.rider)
    gatewayIds?: RiderToGateway[];
   

    @OneToMany(()=>Request, (travel: Request)=>travel.rider,{ onDelete: 'SET NULL' ,onUpdate: 'CASCADE' })
    requests:Request[];

    async addToWallet(amount: number, cuurrency: string): Promise<RiderWallet> {
        let rider = await Rider.findOne(this.id, {relations: ['wallet']});
        let wItem: any = rider.wallet.find(x=>x.currency == cuurrency);
        if(wItem == null) {
            wItem = {amount: amount, currency: cuurrency};
            let insert = await RiderWallet.insert({amount: amount, currency: cuurrency, rider: {id: this.id}});
            wItem['id'] = insert.raw.insertId;
        } else {
            await RiderWallet.update(wItem.id, {amount: amount + wItem.amount});
            wItem.amount += amount;
        }
        return wItem;
    }
}
