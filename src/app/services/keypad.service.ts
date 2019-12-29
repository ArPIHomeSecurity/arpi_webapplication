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

    // add authorization header with jwt token
    const headers = new HttpHeaders( { 'Authorization': 'Bearer ' + this.authService.getToken() } );

    const params = new HttpParams();
    // get keypads from api
    return this.http.get<Keypad[]>( '/api/keypads/', { headers, params } );
  }


  getKeypad( keypadId: number ): Observable<Keypad> {
    // add authorization header with jwt token
    const headers = new HttpHeaders( { 'Authorization': 'Bearer ' + this.authService.getToken() } );

    // get keypads from api
    return this.http.get<Keypad>( '/api/keypad/' + keypadId, { headers } );
  }


  createKeypad( keypad: Keypad ): Observable<Keypad> {
    // add authorization header with jwt token
    const headers = new HttpHeaders( { 'Authorization': 'Bearer ' + this.authService.getToken() } );

    // set keypad from api
    return this.http.post<Keypad>( '/api/keypads/', keypad, { headers } );
  }


  updateKeypad( keypad: Keypad ): Observable<Keypad> {
    // add authorization header with jwt token
    const headers = new HttpHeaders( { 'Authorization': 'Bearer ' + this.authService.getToken() } );

    // set keypad from api
    return this.http.put<Keypad>( '/api/keypad/' + keypad.id, keypad, { headers } );
  }

  deleteKeypad( keypadId: number ): Observable<boolean> {
    // add authorization header with jwt token
    const headers = new HttpHeaders( { 'Authorization': 'Bearer ' + this.authService.getToken() } );

    // set keypad from api
    return this.http.delete<boolean>( '/api/keypad/' + keypadId, { headers } );
  }

  getKeypadTypes(): Observable<KeypadType[]> {
    // add authorization header with jwt token
    const headers = new HttpHeaders( { 'Authorization': 'Bearer ' + this.authService.getToken() } );

    // get keypad types from api
    return this.http.get<KeypadType[]>( '/api/keypadtypes', { headers } );
  }
}


