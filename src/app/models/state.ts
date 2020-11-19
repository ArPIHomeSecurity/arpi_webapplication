
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

// monitoring system states from the backend
const MONITORING_STARTUP = 'monitoring_startup';
const MONITORING_READY = 'monitoring_ready';
const MONITORING_UPDATING_CONFIG = 'monitoring_updating_config';
const MONITORING_INVALID_CONFIG = 'monitoring_invalid_config';
const MONITORING_ARMED = 'monitoring_armed';
const MONITORING_SABOTAGE = 'monitoring_sabotage';
const MONITORING_ERROR = 'monitoring_error';



export function String2MonitoringState(systemState: string): MonitoringState {
  switch ( systemState ) {
    case MONITORING_STARTUP:
      return MonitoringState.STARTUP;
    case MONITORING_READY:
      return MonitoringState.READY;
    case MONITORING_UPDATING_CONFIG:
      return MonitoringState.UPDATING_CONFIG;
    case MONITORING_INVALID_CONFIG:
      return MonitoringState.INVALID_CONFIG;
    case MONITORING_ARMED:
      return MonitoringState.ARMED;
    case MONITORING_SABOTAGE:
      return MonitoringState.SABOTAGE;
    case MONITORING_ERROR:
      return MonitoringState.ERROR;
    default:
      console.error('Unknown monitoring state!' + systemState);
  }
}


export function MonitoringState2String(systemState: MonitoringState): string {
  switch ( systemState ) {
    case MonitoringState.STARTUP:
      return MONITORING_STARTUP;
    case MonitoringState.READY:
      return MONITORING_READY;
    case MonitoringState.UPDATING_CONFIG:
      return MONITORING_UPDATING_CONFIG;
    case MonitoringState.INVALID_CONFIG:
      return MONITORING_INVALID_CONFIG;
    case MonitoringState.ARMED:
      return MONITORING_ARMED;
    case MonitoringState.SABOTAGE:
      return MONITORING_SABOTAGE;
    case MonitoringState.ERROR:
      return MONITORING_ERROR;
    default:
      console.error('Unknown monitoring state!' + systemState);
  }
}

export class Clocks {
  system: string;
  network: string;
  timezone: string;
}
