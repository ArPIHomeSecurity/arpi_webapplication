
import { Observable } from 'rxjs';

import { ArmType, Clocks, KeypadType, MonitoringState } from '../models';


export interface MonitoringService {

  isAlert(): Observable<boolean>;

  getArmState(): Observable<ArmType>;

  arm( armtype: ArmType );

  disarm();

  getMonitoringState(): Observable<MonitoringState>;

  getVersion(): Observable<string>;

  getClock(): Observable<Clocks>;

  synchronizeClock();

  changeClock(dateTime: string, timeZone: string);

  getKeypadTypes(): Observable<KeypadType[]>;
}
