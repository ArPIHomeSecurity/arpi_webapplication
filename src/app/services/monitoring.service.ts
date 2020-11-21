
import { Observable } from 'rxjs';

import { ARM_TYPE, Clocks, KeypadType, MONITORING_STATE } from '../models';


export interface MonitoringService {

  isAlert(): Observable<boolean>;

  getArmState(): Observable<ARM_TYPE>;

  arm( armtype: ARM_TYPE );

  disarm();

  getMonitoringState(): Observable<MONITORING_STATE>;

  getVersion(): Observable<string>;

  getClock(): Observable<Clocks>;

  synchronizeClock();

  changeClock(dateTime: string, timeZone: string);

  getKeypadTypes(): Observable<KeypadType[]>;
}
