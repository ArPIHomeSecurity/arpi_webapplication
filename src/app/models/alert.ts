export enum ArmType {
  DISARMED = 0,
  AWAY = 1,
  STAY = 2
}

export class Alert {
  id: number;
  arm_type: ArmType;
  start_time: Date;
  end_time: Date;
  sensors: AlertSensor[];
}

export class AlertSensor {
  id: number;
  channel: number;
  description: String;
}