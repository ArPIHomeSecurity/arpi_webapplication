import { Observable } from 'rxjs';

import { Keypad, KeypadType } from '@app/models';


export interface KeypadService {

  /** Not implemented yet */
  getKeypads(): Observable<Keypad[]>;

  getKeypad( keypadId: number ): Observable<Keypad>;

  createKeypad( keypad: Keypad ): Observable<Keypad>;

  updateKeypad( keypad: Keypad ): Observable<Keypad>;

  deleteKeypad( keypadId: number ): Observable<boolean>;

  getKeypadTypes(): Observable<KeypadType[]>;
}


