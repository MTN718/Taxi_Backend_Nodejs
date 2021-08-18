import { EventSubscriber, EntitySubscriberInterface, InsertEvent, UpdateEvent } from "typeorm";
import { Complaint } from "../entities/complaint";
import Container from "typedi";
import { Stats } from "../models/stats";

@EventSubscriber()
export class ComplaintSubscriber implements EntitySubscriberInterface<Complaint> {
    listenTo() {
        return Complaint;
    }

    afterInsert(event: InsertEvent<Complaint>) {
        Container.get(Stats).complaints = Container.get(Stats).complaints + 1;
        (Container.get('io') as any).of('/cms').emit('statChanged', { key: 'complaints', value: 1});
        (Container.get('io') as any).of('/cms').emit('newNotification', { type: 'Complaint', id: event.entity.id});
    }

    afterUpdate(event: UpdateEvent<Complaint>) {
        if(event.entity.isReviewed) {
            Container.get(Stats).complaints = Container.get(Stats).complaints - 1;
            (Container.get('io') as any).of('/cms').emit('statChanged', { key: 'complaints', value: -1});
        } else {
            Container.get(Stats).complaints = Container.get(Stats).complaints + 1;
            (Container.get('io') as any).of('/cms').emit('statChanged', { key: 'complaints', value: 1});
        }
    }

}