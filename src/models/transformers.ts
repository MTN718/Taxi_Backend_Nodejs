import { ValueTransformer } from "typeorm"
import CoordinateXY from "./coordinatexy"

export class ColumnFloatTransformer implements ValueTransformer {
	to(data?: number | null): number | null {
		return data
	}

	from(data?: string | null): number | null {
		if (!isNullOrUndefined(data)) {
			const res = parseFloat(data)
			if (isNaN(res)) {
				return null
			} else {
				return res
			}
		}
		return null
    }
}

export class ColumnIntTransformer implements ValueTransformer {
	to(data?: number | null): number | null {
		return data;
	}

	from(data?: string | null): number | null {
		if (!isNullOrUndefined(data)) {
			const res = parseInt(data)
			if (isNaN(res)) {
				return null
			} else {
				return res
			}
		}
		return null
    }
}

export class PolygonTransformer implements ValueTransformer {
	to(value: CoordinateXY[]): string {
		return `POLYGON((${value.map((x: CoordinateXY) => `${x.x} ${x.y}`).join(',')}))`
	}
	from(value: string): CoordinateXY[] {
		let i = value.substring(9, value.length - 2).split(',').map(x => {
			let s = x.split(' ')
			return {
				x: parseFloat(s[0]),
				y: parseFloat(s[1])
			}
		})
		return i
	}
}

export class MultipointTransformer implements ValueTransformer {
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
		return i
	}
}

export class BooleanTransformer implements ValueTransformer {
	to(data?: boolean): number {
		return data ? 1 : 0
	}

	from(data?: number | null): boolean | null {
		if (!isNullOrUndefined(data)) {
			return data == 1;
		} else {
            return null;
        }
    }
}

export class TimestampTransformer implements ValueTransformer {
	to(value: number): Date {
		if(typeof value != 'number') {
			return value;
		}
		return new Date(value)
	}

	from(value: Date): number {
		return value != null ? value.getTime() : null;
	}
}

export class DefaultTimestampTransformer implements ValueTransformer {
	to(value: number): Date {
		return value == null ? new Date() : new Date(value)
	}

	from(value: Date): number {
		if(!isNaN(value as any)) {
			return value as any;
		}
		return value != null ? value.getTime() : null;
	}
}

function isNullOrUndefined<T>(obj: T | null | undefined): obj is null | undefined {
    return typeof obj === "undefined" || obj === null
}