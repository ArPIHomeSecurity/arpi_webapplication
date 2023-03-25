import { Alert } from "./alert";
import { Arm, Disarm } from "./arm";


export class ArmEvent {
    arm: Arm
    disarm: Disarm
    alert: Alert
}

export class AlertEvent {
    disarm: Disarm
    alert: Alert
}
