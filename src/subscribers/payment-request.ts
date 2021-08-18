import { EventSubscriber, EntitySubscriberInterface, InsertEvent, UpdateEvent } from "typeorm";
import Container from "typedi";
import { Stats } from "../models/stats";
import { PaymentRequest, PaymenRequestStatus } from "../entities/payment-request";

@EventSubscriber()
export class PaymentRequestSubscriber implements EntitySubscriberInterface<PaymentRequest> {
    listenTo() {
        return PaymentRequest;
    }

    afterInsert(event: InsertEvent<PaymentRequest>) {
        Container.get(Stats).paymentRequests = Container.get(Stats).paymentRequests + 1;
        (Container.get('io') as any).of('/cms').emit('statChanged', { key: 'paymentRequests', value: 1});
        (Container.get('io') as any).of('/cms').emit('newNotification', { type: 'PaymentRequest', id: event.entity.id});
    }

    afterUpdate(event: UpdateEvent<PaymentRequest>) {
        if(event.entity.status == PaymenRequestStatus.Paid) {
            Container.get(Stats).paymentRequests = Container.get(Stats).paymentRequests - 1;
            (Container.get('io') as any).of('/cms').emit('statChanged', { key: 'paymentRequests', value: -1});
        } else {
            Container.get(Stats).paymentRequests = Container.get(Stats).paymentRequests + 1;
            (Container.get('io') as any).of('/cms').emit('statChanged', { key: 'paymentRequests', value: 1});
        }
    }
}