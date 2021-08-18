import SocketController from "../interfaces/socket.controller.interface";
import { Operator, PermissionDefault } from "../../entities/operator";
import { getRepository, FindManyOptions, Like } from "typeorm";

export default class CrudController extends SocketController {
    constructor(socket: any) {
        super(socket)
        socket.on('getRows', this.getRows.bind(this));
        socket.on('saveRow', this.saveRow.bind(this));
        socket.on('deleteRows', this.deleteRows.bind(this));
        socket.on('getDefault', this.getDefault.bind(this));
        socket.on('setColumnValue', this.setColumnValue.bind(this));
    }

    async getRows(dto: getRowDto, callback) {
        let operator = await Operator.findOne(this.socket.user.id);
        if (operator['permission' + dto.table] !== undefined && operator['permission' + dto.table].indexOf('view') < 0) {
            callback(410);
            return;
        }
        try {
            
            let options: FindManyOptions = {};
            if(dto.filters) {
                options.where = dto.filters;
            }
            if(dto.sort) {
                let _sort = {};
                _sort[dto.sort.property] = dto.sort.direction;
                options.order = _sort;
            }
            if(dto.pageSize != null) {
                options.take = dto.pageSize;
                options.skip = dto.from;
            }
            if(dto.relations) {
                options.relations = dto.relations;
            }
            if(dto.fullTextFields && dto.fullTextFields.length > 0 && dto.fullTextValue && dto.fullTextValue != '') {
                options.where = dto.fullTextFields.map(x=>{
                    let a = dto.filters ? JSON.parse(JSON.stringify(dto.filters)) : {};
                    a[x] = Like(`%${dto.fullTextValue}%`);
                    return a;
                });
            }
            let [result, count] = await getRepository(dto.table).findAndCount(options);
            callback(200, {
                data: result,
                count: count
            });
        } catch (error) {
            if (error.message !== undefined)
                callback(666, error.message);
            else
                callback(666, error);
        }
    }

    async saveRow(table: string, row: any, callback) {
        try {
            let operator = await Operator.findOne(this.socket.user.id);
            if (operator['permission' + table] !== undefined && operator['permission' + table].indexOf(PermissionDefault.Update) < 0) {
                callback(411);
                return;
            }
            let result = await getRepository(table).save(row);
            callback(200, result);

        } catch (error) {
            if (error.message !== undefined)
                callback(666, error.message);
            else
                callback(666, error);
        }
    }

    async getDefault(table: string, callback: ((arg0: object) => void)) {
        let item = {};
        let withDefault = getRepository(table).metadata.columns;
        for(let col of withDefault) {
            item[col.propertyName] = col.default;
        }
        callback(item);
    }

    async deleteRows(table: string, criteria: number[] | object, callback) {
        try {
            let operator = await Operator.findOne(this.socket.user.id)
            if (operator['permission' + table] !== undefined && operator['permission' + table].indexOf(PermissionDefault.Delete) < 0) {
                callback(412);
                return;
            }
            let result = await getRepository(table).delete(criteria)
            callback(200, result.raw);
        } catch (error) {
            callback(666, error);
        }
    }

    async setColumnValue(tableName: string, id: number, column: string, value: any, callback) {
        try {
            let row = {}
            row[column] = value;
            let result = getRepository(tableName).update(id, row)
            if (result)
                callback(200);
            else
                callback(666);
        } catch (error) {
            callback(666, error);
        }
    }
}

interface getRowDto {
    table: string,
    filters: object,
    sort: Sort,
    from: number,
    pageSize: number,
    fullTextFields: [string],
    fullTextValue: string,
    relations: [string]
}

interface Sort {
    direction: 'ASC' | 'DESC'
    property: string
}