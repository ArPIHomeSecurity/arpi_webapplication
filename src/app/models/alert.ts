
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
    case ARM_DISARM:
      return ArmType.DISARMED;
    case ARM_AWAY:
      return ArmType.AWAY;
    case ARM_STAY:
      return ArmType.STAY;
    default:
      console.error( 'Unknown arm type!', armType );
  }
}

export function ArmType2String( armType: ArmType): string {
  if ( armType === ArmType.AWAY ) {
    return ARM_AWAY;
  } else if ( armType === ArmType.STAY ) {
    return ARM_STAY;
  } else if ( armType === ArmType.DISARMED ) {
    return ARM_DISARM;
  }
}

export function String2AlertType( alertType: string ): AlertType {
  switch ( alertType ) {
    case ALERT_SABOTAGE:
      return AlertType.SABOTAGE;
    case ALERT_AWAY:
      return AlertType.AWAY;
    case ALERT_STAY:
      return AlertType.STAY;
    default:
      console.error( 'Unknown alert type!' + alertType );
  }
}

export function AlertType2String( alertType: AlertType): string {
  if ( alertType === AlertType.AWAY ) {
    return ALERT_AWAY;
  } else if ( alertType === AlertType.STAY ) {
    return ALERT_STAY;
  } else if ( alertType === AlertType.SABOTAGE ) {
    return ALERT_SABOTAGE;
  }
}
