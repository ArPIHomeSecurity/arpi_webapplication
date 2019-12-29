import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { delay } from 'rxjs/operators';

import { EventService } from '../services/event.service';
import { MonitoringService } from './monitoring.service';
import { environment, KEYPADS, KEYPAD_TYPES } from '../../environments/environment';
import { Keypad, KeypadType } from '../models';

@Injectable()
export class KeypadService {

  keypad: Keypad = KEYPADS[0];
  keypadTypes: KeypadType[] = KEYPAD_TYPES;

  constructor(
    private eventService: EventService,
    private monitoringService: MonitoringService
  ) { }

  getKeypads(): Observable<Keypad[]> {
    return of(Object.assign([], [this.keypad])).pipe(delay(environment.delay));
  }


  getKeypad( keypadId: number ): Observable<Keypad> {
    return of(Object.assign([], this.keypad)).pipe(delay(environment.delay));
  }


  createKeypad( keypad: Keypad ): Observable<Keypad> {
    this.keypad = keypad;
    return of(Object.assign([], this.keypad)).pipe(delay(environment.delay));
  }


  updateKeypad( keypad: Keypad ): Observable<Keypad> {
    this.keypad = keypad;
    return of(Object.assign([], this.keypad)).pipe(delay(environment.delay));
  }

  deleteKeypad( keypadId: number ): Observable<boolean> {
    this.keypad = null;
    return of(Object.assign([], true)).pipe(delay(environment.delay));
  }

  getKeypadTypes(): Observable<KeypadType[]> {
    return of(Object.assign([], this.keypadTypes)).pipe(delay(environment.delay));
  }
}


