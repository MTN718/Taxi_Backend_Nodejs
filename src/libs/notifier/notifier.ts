
import RiderNotifier from './rider-notifier';
import DriverNotifier from './driver-notifier';

export default class Notifier {
    driver: DriverNotifier
    rider: RiderNotifier

    constructor() {
        this.driver = new DriverNotifier()
        this.rider = new RiderNotifier()
    }

    
}