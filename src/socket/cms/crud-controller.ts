import SocketController from "../interfaces/socket.controller.interface";
import { Operator, PermissionDefault } from "../../entities/operator";
import { getRepository, FindManyOptions, Like, BaseEntity, Between, In } from "typeorm";
import CMSException, { PermissionDeniedException, UnknownException } from "./exceptions/cms.exception";

export default class CrudController extends SocketController {
    constructor(socket: any) {
        super(socket)
        socket.on('getRows', this.getRows.bind(this));
        socket.on('saveRow', this.saveRow.bind(this));
        socket.on('deleteRows', this.deleteRows.bind(this));
        socket.on('getDefault', this.getDefault.bind(this));
    }

    async getRows(dto: getRowsDto, callback: (arg0: CMSException | { data: any, count: number }) => void) {
        let operator = await Operator.findOne(this.socket.user.id);
        let tablePermission = dto.table;
        if(dto.table == 'VendorCategory') {
            tablePermission = 'Vendor'
        }
        if (operator['permission' + tablePermission] !== undefined && operator['permission' + tablePermission].indexOf('view') < 0) {
            callback(new PermissionDeniedException());
            return;
        }
        try {
            let options: FindManyOptions = {};
            if (dto.filters) {
                for (let k of Object.keys(dto.filters)) {
                    if (typeof dto.filters[k] != 'string')
                        continue;
                    if (dto.filters[k].includes('^')) {
                        let a = dto.filters[k].split('^');
                        dto.filters[k] = Between(a[0], a[1]) as any;
                    } else if (dto.filters[k].startsWith('%') && dto.filters[k].endsWith('%')) {
                        dto.filters[k] = Like(dto.filters[k]) as any;
                    } else if (dto.filters[k].includes('|')) {
                        let s = dto.filters[k].split('|');
                        dto.filters[k] = In(s);
                    }
                }
                options.where = dto.filters;
            }
            if (dto.sort) {
                let _sort = {};
                _sort[dto.sort.property] = dto.sort.direction;
                options.order = _sort;
            }
            if (dto.pageSize != null) {
                options.take = dto.pageSize;
                options.skip = (dto.page - 1) * (dto.pageSize);
            }
            if (dto.relations && dto.relations.length > 0) {
                options.relations = dto.relations;
            } else {
                options.loadRelationIds = true;
            }
            if (dto.fullTextFields && dto.fullTextFields.length > 0 && dto.fullTextValue && dto.fullTextValue != '') {
                options.where = dto.fullTextFields.map(x => {
                    let a = dto.filters ? JSON.parse(JSON.stringify(dto.filters)) : {};
                    a[x] = Like(`%${dto.fullTextValue}%`);
                    return a;
                });
            }
            let [result, count] = await getRepository(dto.table).findAndCount(options);
            callback({
                data: result,
                count: count
            });
        } catch (error) {
            callback(new UnknownException(JSON.stringify(error)));
        }
    }

    async saveRow(object: any, callback: (arg0: CMSException | BaseEntity) => void) {
        try {
            let operator = await Operator.findOne(this.socket.user.id);
            let tablePermission = object.table;
            if(object.table == 'VendorCategory') {
                tablePermission = 'Vendor'
            }
            if (operator['permission' + tablePermission] !== undefined && operator['permission' + tablePermission].indexOf(PermissionDefault.Update) < 0) {
                callback(new PermissionDeniedException());
                return;
            }
            let result = await getRepository(object.table).save(object.row);
            callback(result);
        } catch (error) {
            callback(new UnknownException(error.message));
        }
    }

    async getDefault(table: string, callback: ((arg0: object) => void)) {
        let item = {};
        let withDefault = getRepository(table).metadata.columns;
        for (let col of withDefault) {
            item[col.propertyName] = col.default;
        }
        callback(item);
    }

    async deleteRows(dto: { table: string, criteria: number[] | {} | number }, callback) {
        try {
            let operator = await Operator.findOne(this.socket.user.id);
            let tablePermission = dto.table;
            if(dto.table == 'VendorCategory') {
                tablePermission = 'Vendor'
            }
            if (operator['permission' + tablePermission] !== undefined && operator['permission' + tablePermission].indexOf(PermissionDefault.Delete) < 0) {
                callback(new PermissionDeniedException());
                return;
            }
            let result = await getRepository(dto.table).delete(dto.criteria);
            callback(result.raw);
        } catch (error) {
            callback(new UnknownException(error.message));
        }
    }
}

interface getRowsDto {
    table: string,
    filters: {},
    sort: Sort,
    page: number,
    pageSize: number,
    fullTextFields: [string],
    fullTextValue: string,
    relations: [string]
}

interface Sort {
    direction: 'ASC' | 'DESC'
    property: string
}