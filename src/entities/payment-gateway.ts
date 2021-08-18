import {BaseEntity,Column,Entity,OneToMany,PrimaryGeneratedColumn} from "typeorm";
import { RiderToGateway } from "./rider-to-gateway";
import { DriverToGateway } from "./driver-to-gateway";
import { DriverTransaction } from "./driver-transaction";
import { RiderTransaction } from "./rider-transaction";
import { AdminTransaction } from "./admin-transaction";

export enum PaymentGatewayType {
    Stripe = 'stripe',
    BrainTree = 'braintree',
    Flutterwave = 'flutterwave',
    PayGate = 'paygate',
    PayU = 'payu',
    Paystack = 'paystack',
    Razorpay = 'razorpay',
    Paytm = 'paytm'   
}

@Entity()
export class PaymentGateway extends BaseEntity {

    @PrimaryGeneratedColumn()
    id:number;

    @Column("boolean", {
        default: true
    })
    enabled: boolean;
        
    @Column("varchar",{ 
        nullable:true
    })
    title?:string;
        
    @Column("enum",{
        enum:PaymentGatewayType,
    })
    type:PaymentGatewayType;

    @Column("varchar",{
        nullable: true
    })
    publicKey?: string;

    @Column("varchar")
    privateKey?: string;

    @Column('varchar',{
        nullable: true
    })
    merchantId?: string;

    
    @OneToMany(() => DriverToGateway, driverToGateway => driverToGateway.driver)
    driverToGateways?: DriverToGateway[];


    @OneToMany(() => RiderToGateway, riderToGateway => riderToGateway.rider)
    riderToGateways?: RiderToGateway[];

    @OneToMany(() => DriverTransaction, driverTransaction => driverTransaction.paymentGateway)
    driverTransactions?: DriverTransaction[];

    @OneToMany(() => AdminTransaction, adminTransaction => adminTransaction.paymentGateway)
    adminTransactions?: AdminTransaction[];

    @OneToMany(() => RiderTransaction, riderTransaction => riderTransaction.paymentGateway)
    riderTransactions?: RiderTransaction[];
}
