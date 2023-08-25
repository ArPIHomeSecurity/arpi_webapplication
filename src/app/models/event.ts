import { Alert } from "./alert";
import { Arm, Disarm } from "./arm";


export class ArmEvent {
    arm: Arm
    disarm: Disarm
    alert: Alert
    sensorChanges: SensorsChange[]
}

export class AlertEvent {
    disarm: Disarm
    alert: Alert
}

export class SensorState {
    sensor_id: number
    channel: number
    type_id: number
    description: string
    timestamp: string
    delay: number
    enabled: boolean
}

export class SensorsChange {
    timestamp: string
    sensors: SensorState[]
}