export enum ALERT_TYPE {
  UNDEFINED = 0,
  SABOTAGE = 1,
  AWAY = 2,
  STAY = 3
}

// alert types from the backend system
const ALERT_AWAY = 'alert_away';
const ALERT_STAY = 'alert_stay';
const ALERT_SABOTAGE = 'alert_sabotage';

export class Alert {
  id: number;
  alertType: ALERT_TYPE;
  startTime: string;
  endTime: string;
  silent: boolean;
  sensors: AlertSensor[];
}

export class AlertSensor {
  sensorId: number;
  typeId: number;
  channel: number;
  name: string;
  description: string;
  startTime: string;
  endTime: string;
  delay: number;
  silent: boolean;
  monitorPeriod: number;
  monitorThreshold: number;
}

export const string2AlertType = (alertType: string): ALERT_TYPE =>
  ({
    [ALERT_SABOTAGE]: ALERT_TYPE.SABOTAGE,
    [ALERT_AWAY]: ALERT_TYPE.AWAY,
    [ALERT_STAY]: ALERT_TYPE.STAY
  })[alertType as keyof typeof string2AlertType];

export const alertType2String = (alertType: ALERT_TYPE): string =>
  ({
    [ALERT_TYPE.AWAY]: ALERT_AWAY,
    [ALERT_TYPE.STAY]: ALERT_STAY,
    [ALERT_TYPE.SABOTAGE]: ALERT_SABOTAGE
  })[alertType];
