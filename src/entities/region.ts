import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn, ManyToMany } from "typeorm";
import CoordinateXY from "../models/coordinatexy";
import { Service } from "./service";
import { LatLng, LatLngLiteral } from "@google/maps";


@Entity()
export class Region extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;


    @Column("varchar", {
        nullable: true
    })
    name: string;

    @Column('varchar')
    currency: string;

    @Column("tinyint", {
        width: 1,
        default: 1
    })
    enabled: boolean;


    @Column("polygon", {
        transformer: {
            to(value: LatLngLiteral[][]): string {
                if(value == null) return null;
                let str = value.map((x: LatLngLiteral[]) => {
                    let ar = x.map((y: LatLngLiteral) => `${y.lng} ${y.lat}`);
                    return ar.join(',');
                }).join('),(');
                return `POLYGON((${str}))`;
            },
            from(value: string): LatLng[][] {
                return value.substring(8, value.length - 1).split('),(').map(x => {
                    let res = x.substring(1, x.length - 1).split(',').map(y => {
                        let s = y.split(' ');
                        return {
                            lng: parseFloat(s[0]),
                            lat: parseFloat(s[1])
                        }
                    });
                    return res;
                });
            }
        }
    })
    location: CoordinateXY[][];

    @ManyToMany(() => Service, service => service.regions)
    services:Service[];

}
