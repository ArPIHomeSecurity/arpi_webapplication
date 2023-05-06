import { Alert } from "./alert";
import { Arm, Disarm } from "./arm";


export class ArmEvent {
    arm: Arm
    disarm: Disarm
    alert: Alert
    armSensors: ArmSensors[]
}

export class AlertEvent {
    disarm: Disarm
    alert: Alert
}

export class ArmSensor {
    sensor_id: number
    channel: number
    type_id: number
    description: string
    timestamp: string
    delay: number
    enabled: boolean
}

export class ArmSensors {
    timestamp: string
    sensors: ArmSensor[]
}