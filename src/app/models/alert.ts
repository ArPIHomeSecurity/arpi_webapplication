import { environment } from '../../environments/environment';

export enum ArmType {
  DISARMED = 0,
  AWAY = 1,
  STAY = 2
}

export enum AlertType {
  SABOTAGE = 0,
  AWAY = 1,
  STAY = 2
}

export class Alert {
  id: number;
  alertType: AlertType;
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

export function String2ArmType( armType: string ): ArmType {
  switch ( armType ) {
    case environment.ARM_DISARM:
      return ArmType.DISARMED;
    case environment.ARM_AWAY:
      return ArmType.AWAY;
    case environment.ARM_STAY:
      return ArmType.STAY;
    default:
      console.error( 'Unknown arm type!', armType );
  }
}

export function ArmType2String( armType: ArmType): string {
  if ( armType === ArmType.AWAY ) {
    return environment.ARM_AWAY;
  } else if ( armType === ArmType.STAY ) {
    return environment.ARM_STAY;
  } else if ( armType === ArmType.DISARMED ) {
    return environment.ARM_DISARM;
  }
}

export function String2AlertType( alertType: string ): AlertType {
  switch ( alertType ) {
    case environment.ALERT_SABOTAGE:
      return AlertType.SABOTAGE;
    case environment.ALERT_AWAY:
      return AlertType.AWAY;
    case environment.ALERT_STAY:
      return AlertType.STAY;
    default:
      console.error( 'Unknown alert type!' + alertType );
  }
}

export function AlertType2String( alertType: AlertType): string {
  if ( alertType === AlertType.AWAY ) {
    return environment.ALERT_AWAY;
  } else if ( alertType === AlertType.STAY ) {
    return environment.ALERT_STAY;
  } else if ( alertType === AlertType.SABOTAGE ) {
    return environment.ALERT_SABOTAGE;
  }
}
