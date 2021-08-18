import * as admin from 'firebase-admin';
import { Driver } from '../../entities/driver';
import { RequestChat } from "../../entities/request-chat";
import Container from 'typedi';

export default class DriverNotifier {
    requests(driver: Array<Driver>, requestId: number) {
        let tokens = driver.map(x=>x.notificationPlayerId);
        (Container.get('firebase.driver') as admin.app.App).messaging().sendToDevice(tokens, {
            notification: {
                sound: 'default',
                badge: '1',
                titleLocKey: 'notification_new_request_title',
                bodyLocKey:'notification_new_request_body'
            }
        })
    }

    message(driver: Driver, message: RequestChat) {
        (Container.get('firebase.driver') as admin.app.App).messaging().sendToDevice([driver.notificationPlayerId], {
            notification: {
                body: message.content,
                sound: 'default',
                badge: '1',
                titleLocKey: 'notification_new_message_title'
            }
        })
    }

    paid(driver: Driver) {
        (Container.get('firebase.driver') as admin.app.App).messaging().sendToDevice([driver.notificationPlayerId], {
            notification: {
                titleLocKey: 'notification_paid_title',
                bodyLocKey: 'notification_paid_body'
            }
        })
    }
}