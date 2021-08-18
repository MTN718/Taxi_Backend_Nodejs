import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Media } from "./media";
import { TimestampTransformer } from "../models/transformers";


@Entity()
export class Promotion extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;


    @Column("varchar", {
        nullable: true
    })
    title?: string;


    @Column("varchar", {
        nullable: true
    })
    description?: string;


    @ManyToOne(() => Media, (media: Media) => media.promotions, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
    media?: Media;


    @Column("timestamp", {
        nullable: true,
        transformer: new TimestampTransformer()
    })
    startTimestamp?: number;


    @Column("timestamp", {
        nullable: true,
        transformer: new TimestampTransformer()
    })
    expirationTimestamp?: number;

}
