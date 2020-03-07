import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';


import { Keypad, KeypadType } from '../models';
import { AuthenticationService } from './authentication.service';

@Injectable()
export class KeypadService {
  constructor(
    private http: HttpClient,
    private authService: AuthenticationService
  ) { }

  /** Not implemented yet */
  getKeypads(): Observable<Keypad[]> {
    // get keypads from api
    return this.http.get<Keypad[]>('/api/keypads/');
  }


  getKeypad( keypadId: number ): Observable<Keypad> {
    // get keypads from api
    return this.http.get<Keypad>('/api/keypad/' + keypadId);
  }


  createKeypad( keypad: Keypad ): Observable<Keypad> {
    // set keypad from api
    return this.http.post<Keypad>('/api/keypads/', keypad);
  }


  updateKeypad( keypad: Keypad ): Observable<Keypad> {
    // set keypad from api
    return this.http.put<Keypad>('/api/keypad/' + keypad.id, keypad);
  }

  deleteKeypad( keypadId: number ): Observable<boolean> {
    // set keypad from api
    return this.http.delete<boolean>('/api/keypad/' + keypadId);
  }

  getKeypadTypes(): Observable<KeypadType[]> {
    // get keypad types from api
    return this.http.get<KeypadType[]>('/api/keypadtypes');
  }
}


