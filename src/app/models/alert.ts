import { environment } from '../../environments/environment';

export enum ArmType {
  DISARMED = 0,
  AWAY = 1,
  STAY = 2
}

export class Alert {
  id: number;
  arm_type: ArmType;
  start_time: string;
  end_time: string;
  sensors: AlertSensor[];
}

export class AlertSensor {
  id: number;
  type_id: number;
  channel: number;
  description: String;
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
      console.error( 'Unknown arm type!' + armType );
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
