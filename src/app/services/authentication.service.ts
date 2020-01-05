
import {map} from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';

import * as JWT from 'jwt-decode';
import { EventService } from '../services/event.service';

@Injectable()
export class AuthenticationService {
  private _isDeviceRegistered = new Subject<boolean>();

  constructor(
      private http: HttpClient,
      private eventService: EventService
  ) { }

  login(access_code: string): Observable<boolean> {
    const headers = new HttpHeaders({'Content-Type': 'application/json'});
    return this.http.post('/api/authenticate', JSON.stringify({access_code: access_code}), {headers: headers}).pipe(
      map((response) => {
        // login successful if there's a jwt token in the response
        if (response['device_token']) {
          localStorage.setItem('deviceToken', response['device_token']);
          this.eventService.connect();
          this._isDeviceRegistered.next(true);
        }
        if (response['user_token']) {
          const newUser = JWT(response['user_token']);
          // store user info with jwt token in local storage to keep user logged in between page refreshes
          localStorage.setItem('currentUser', JSON.stringify(newUser));
          localStorage.setItem('userToken', response['user_token']);


          // return true to indicate successful login
          return true;
        } else {
          // return false to indicate failed login
          return false;
        }
      }));
  }

  logout(): void {
    // clear token remove user from local storage to log user out
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userToken');
  }

  isLoggedIn() {
    try {
      return JWT(localStorage.getItem('userToken'));
    } catch (error) {
        // console.error('Invalid token');
    }
    return false;
  }

  getRole(): string {
    const userToken = localStorage.getItem('userToken');
    if (userToken) {
      return JWT(userToken)['role'];
    }
  }

  getUsername(): string {
    const userToken = localStorage.getItem('userToken');
    if (userToken) {
      return JWT(userToken)['name'];
    }
  }

  getToken(): string {
    if (localStorage.getItem('userToken')) {
      return localStorage.getItem('userToken');
    } else if (localStorage.getItem('deviceToken')) {
      return localStorage.getItem('deviceToken');
    }
  }

  isDeviceRegistered(): Observable<boolean> {
    return this._isDeviceRegistered;
  }
}
