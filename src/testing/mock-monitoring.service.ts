import { Injectable } from '@angular/core';
import { ARM_TYPE, Clocks, KeypadType, MONITORING_STATE, POWER_STATE } from '@app/models';
import { Observable, of } from 'rxjs';

/**
 * Mock Monitoring Service for testing
 */
@Injectable()
export class MockMonitoringService {
  isAlert(): Observable<boolean> {
    return of(false);
  }

  getArmState(): Observable<ARM_TYPE> {
    return of(ARM_TYPE.DISARMED);
  }

  arm(armtype: ARM_TYPE): Observable<Object> {
    return of({ success: true, armType: armtype });
  }

  disarm(): Observable<Object> {
    return of({ success: true });
  }

  getMonitoringState(): Observable<MONITORING_STATE> {
    return of(MONITORING_STATE.READY);
  }

  getVersion(): Observable<string> {
    return of('1.0.0-test');
  }

  getClock(): Observable<Clocks> {
    const clock = new Clocks();
    clock.system = new Date().toISOString();
    clock.network = new Date().toISOString();
    clock.timezone = 'UTC';
    return of(clock);
  }

  synchronizeClock(): Observable<any> {
    return of({ success: true });
  }

  changeClock(dateTime: string, timeZone: string): Observable<any> {
    return of({ success: true, dateTime, timeZone });
  }

  getKeypadTypes(): Observable<KeypadType[]> {
    return of([
      { id: 1, name: 'Test Keypad 1' },
      { id: 2, name: 'Test Keypad 2' }
    ] as KeypadType[]);
  }

  getPowerState(): Observable<POWER_STATE> {
    return of(POWER_STATE.NETWORK);
  }
}
