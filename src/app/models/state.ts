import { environment } from '../../environments/environment';

export enum MonitoringState {
  NOT_READY = 0,
  STARTUP = 1,
  READY = 2,
  UPDATING_CONFIG = 3,
  INVALID_CONFIG = 4,
  ARMED = 5,
  SABOTAGE = 6,
  ERROR = 7
}


export function String2MonitoringState(systemState: string): MonitoringState {
  switch ( systemState ) {
    case environment.MONITORING_STARTUP:
      return MonitoringState.STARTUP;
    case environment.MONITORING_READY:
      return MonitoringState.READY;
    case environment.MONITORING_UPDATING_CONFIG:
      return MonitoringState.UPDATING_CONFIG;
    case environment.MONITORING_INVALID_CONFIG:
      return MonitoringState.INVALID_CONFIG;
    case environment.MONITORING_ARMED:
      return MonitoringState.ARMED;
    case environment.MONITORING_SABOTAGE:
      return MonitoringState.SABOTAGE;
    case environment.MONITORING_ERROR:
      return MonitoringState.ERROR;
    default:
      console.error('Unknown monitoring state!' + systemState);
  }
}


export function MonitoringState2String(systemState: MonitoringState): string {
  switch ( systemState ) {
    case MonitoringState.STARTUP:
      return environment.MONITORING_STARTUP;
    case MonitoringState.READY:
      return environment.MONITORING_READY;
    case MonitoringState.UPDATING_CONFIG:
      return environment.MONITORING_UPDATING_CONFIG;
    case MonitoringState.INVALID_CONFIG:
      return environment.MONITORING_INVALID_CONFIG;
    case MonitoringState.ARMED:
      return environment.MONITORING_ARMED;
    case MonitoringState.SABOTAGE:
      return environment.MONITORING_SABOTAGE;
    case MonitoringState.ERROR:
      return environment.MONITORING_ERROR;
    default:
      console.error('Unknown monitoring state!' + systemState);
  }
}
