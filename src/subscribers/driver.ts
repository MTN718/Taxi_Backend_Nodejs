import { EventSubscriber, EntitySubscriberInterface, InsertEvent, UpdateEvent } from "typeorm";
import Container from "typedi";
import { Stats } from "../models/stats";
import { Driver, DriverStatus } from "../entities/driver";

@EventSubscriber()
export class DriverSubscriber implements EntitySubscriberInterface<Driver> {
    listenTo() {
        return Driver;
    }

    afterInsert(event: InsertEvent<Driver>) {
        Container.get(Stats).driversPending = Container.get(Stats).driversPending + 1;
        (Container.get('io') as any).of('/cms').emit('statChanged', { key: 'driversPending', value: 1});
    }

    afterUpdate(event: UpdateEvent<Driver>) {
        if(event.databaseEntity == undefined || event.entity == undefined)
            return;
        if(event.databaseEntity.status == DriverStatus.PendingApproval && event.entity.status != DriverStatus.PendingApproval) {
            Container.get(Stats).driversPending = Container.get(Stats).driversPending - 1;
            (Container.get('io') as any).of('/cms').emit('statChanged', { key: 'driversPending', value: -1});
        }
        if(event.databaseEntity.status != DriverStatus.PendingApproval && event.entity.status == DriverStatus.PendingApproval) {
            Container.get(Stats).driversPending = Container.get(Stats).driversPending + 1;
            (Container.get('io') as any).of('/cms').emit('statChanged', { key: 'driversPending', value: 1});
        }
        if(event.databaseEntity.status == DriverStatus.Online && event.entity.status != DriverStatus.Online) {
            Container.get(Stats).availableDrivers = Container.get(Stats).availableDrivers - 1;
            (Container.get('io') as any).of('/cms').emit('statChanged', { key: 'availableDrivers', value: -1});
        }
        if(event.databaseEntity.status != DriverStatus.Online && event.entity.status == DriverStatus.Online) {
            Container.get(Stats).availableDrivers = Container.get(Stats).availableDrivers + 1;
            (Container.get('io') as any).of('/cms').emit('statChanged', { key: 'availableDrivers', value: 1});
        }
        if(event.databaseEntity.status == DriverStatus.InService && event.entity.status != DriverStatus.InService) {
            Container.get(Stats).inServiceDrivers = Container.get(Stats).inServiceDrivers - 1;
            (Container.get('io') as any).of('/cms').emit('statChanged', { key: 'inService', value: -1});
        }
        if(event.databaseEntity.status != DriverStatus.Online && event.entity.status == DriverStatus.Online) {
            Container.get(Stats).inServiceDrivers = Container.get(Stats).inServiceDrivers + 1;
            (Container.get('io') as any).of('/cms').emit('statChanged', { key: 'inService', value: 1});
        }
        if((event.databaseEntity.status == DriverStatus.WaitingDocuments || event.databaseEntity.status == DriverStatus.SoftReject) && event.entity.status == DriverStatus.PendingApproval) {
            (Container.get('io') as any).of('/cms').emit('newNotification', { type: 'Driver', id: event.entity.id});
        }
    }

}