
export enum ARM_TYPE {
  UNDEFINED = 0,
  DISARMED = 1,
  AWAY = 2,
  STAY = 3
}

export enum ALERT_TYPE {
  UNDEFINED = 0,
  SABOTAGE = 1,
  AWAY = 2,
  STAY = 3
}

// monitoring arm types from the backend system
const ARM_AWAY = 'arm_away';
const ARM_STAY = 'arm_stay';
const ARM_DISARM = 'disarm';

// alert types from the backend system
const ALERT_AWAY = 'alert_away';
const ALERT_STAY = 'alert_stay';
const ALERT_SABOTAGE = 'alert_sabotage';

export class Alert {
  id: number;
  alertType: ALERT_TYPE;
  startTime: string;
  endTime: string;
  sensors: AlertSensor[];
}

export class AlertSensor {
  sensorId: number;
  typeId: number;
  channel: number;
  description: string;
}

export const string2ArmType = (armType: string): ARM_TYPE => ({
  [ARM_DISARM]: ARM_TYPE.DISARMED,
  [ARM_AWAY]: ARM_TYPE.AWAY,
  [ARM_STAY]: ARM_TYPE.STAY
})[armType as keyof typeof string2ArmType];

export const armType2String = (armType: ARM_TYPE): string => ({
  [ARM_TYPE.AWAY]: ARM_AWAY,
  [ARM_TYPE.STAY]: ARM_STAY,
  [ARM_TYPE.DISARMED]: ARM_DISARM
})[armType];

export const string2AlertType = (alertType: string): ALERT_TYPE => ({
  [ALERT_SABOTAGE]: ALERT_TYPE.SABOTAGE,
  [ALERT_AWAY]: ALERT_TYPE.AWAY,
  [ALERT_STAY]: ALERT_TYPE.STAY,
})[alertType as keyof typeof string2AlertType];

export const alertType2String = (alertType: ALERT_TYPE): string => ({
  [ALERT_TYPE.AWAY]: ALERT_AWAY,
  [ALERT_TYPE.STAY]: ALERT_STAY,
  [ALERT_TYPE.SABOTAGE]: ALERT_SABOTAGE
})[alertType];
