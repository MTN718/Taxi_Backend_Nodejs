import * as admin from 'firebase-admin';
import { RequestChat } from "../../entities/request-chat";
import { Rider } from '../../entities/rider';
import Container from 'typedi';

export default class RiderNotifier {
    message(rider: Rider, message: RequestChat) {
        (Container.get('firebase.rider') as admin.app.App).messaging().sendToDevice(rider.notificationPlayerId, {
            notification: {
                body: message.content,
                sound: 'default',
                badge: '1',
                titleLocKey: 'notification_new_message_title'
            }
        })
    }

    arrived(rider: Rider) {
        (Container.get('firebase.rider') as admin.app.App).messaging().sendToDevice(rider.notificationPlayerId, {
            notification: {
                sound: 'default',
                titleLocKey: 'notification_arrived_title',
                bodyLocKey: 'notification_arrived_body'
            }
        })
    }

    started(rider: Rider) {
        (Container.get('firebase.rider') as admin.app.App).messaging().sendToDevice(rider.notificationPlayerId, {
            notification: {
                titleLocKey: 'notification_started_title',
                bodyLocKey: 'notification_started_body'
            }
        })
    }

    waitingForPostPay(rider: Rider) {
        (Container.get('firebase.rider') as admin.app.App).messaging().sendToDevice(rider.notificationPlayerId, {
            notification: {
                titleLocKey: 'notification_waiting_for_pay_title',
                bodyLocKey: 'notification_waiting_for_pay_body'
            }
        })
    }

    finished(rider: Rider) {
        (Container.get('firebase.rider') as admin.app.App).messaging().sendToDevice(rider.notificationPlayerId, {
            notification: {
                titleLocKey: 'notification_finished_title',
                bodyLocKey: 'notification_finished_body'
            }
        })
    }
}