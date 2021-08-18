import { EventSubscriber, EntitySubscriberInterface, InsertEvent, UpdateEvent } from "typeorm";
import { Complaint } from "../entities/complaint";
import Container from "typedi";
import { Stats } from "../models/stats";
import { AdminTransaction } from "../entities/admin-transaction";

@EventSubscriber()
export class AdminTransactionSubscriber implements EntitySubscriberInterface<AdminTransaction> {
    listenTo() {
        return AdminTransaction;
    }

    afterInsert(event: InsertEvent<AdminTransaction>) {
        //Container.get(Stats).income = Container.get(Stats).income + 1;
        (Container.get('io') as any).of('/cms').emit('statChanged', { key: 'income', value: event.entity.amount, currency: event.entity.currency});
    }

}