import { ValueTransformer } from "typeorm";

export default class CoordinateXY {
    x: number;
    y: number;
}

export class CoordinatesTransformer implements ValueTransformer {
    to(value: CoordinateXY[]): string {
        return `MULTIPOINT(${value.map((x: CoordinateXY) => `${x.x} ${x.y}`).join(',')})`
    }
    from(value: string): CoordinateXY[] {
        let i = value.substring(11, value.length - 1).split(',').map(x => {
            let s = x.substring(1, x.length - 1).split(' ')
            return {
                x: parseFloat(s[0]),
                y: parseFloat(s[1])
            }
        })
        return i;
    }
}

export class StringToIntTransformer implements ValueTransformer {
    to(value: any) {
        return value;
    }
    from(value: string) {
        return parseInt(value);
    }
}

export class StringToFloatTransformer implements ValueTransformer {
    to(value: any) {
        return value;
    }
    from(value: string) {
        return parseFloat(value);
    }
}