
import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

import { Observable, Subject, of } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import * as JWT from 'jwt-decode';

import { EventService } from './event.service';

import { environment } from 'src/environments/environment';

@Injectable()
export class AuthenticationService implements AuthenticationService {
  private isDeviceRegisteredSubject = new Subject<boolean>();
  private isSessionValidSubject = new Subject<boolean>();

  constructor(
    @Inject('EventService') private eventService: EventService,
    private http: HttpClient,
    private router: Router
  ) { }

  login(accessCode: number): Observable<boolean> {
    const headers = new HttpHeaders({'Content-Type': 'application/json'});
    return this.http.post(
        '/api/user/authenticate',
        JSON.stringify({device_token: localStorage.getItem('deviceToken'), access_code: accessCode}),
        {headers}
      )
      .pipe(
        map((response: any) => {
          // login successful if there's a jwt token in the response
          if (response.device_token) {
            localStorage.setItem('deviceToken', response.device_token);
            this.eventService.connect();
            this.isDeviceRegisteredSubject.next(true);
          }
          if (response.user_token) {
            // store user info with jwt token in local storage to keep user logged in between page refreshes
            this.updateUserToken(response.user_token);

            // return true to indicate successful login
            return true;
          } else {
            // return false to indicate failed login
            return false;
          }
        })
      );
  }

  logout(): void {
    // clear token remove user from local storage to log user out
    localStorage.removeItem('userToken');
    // clear returnUrl to start from home
    localStorage.removeItem('returnUrl');
    this.isSessionValidSubject.next(false);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    try {
      const userToken = localStorage.getItem('userToken');
      if (userToken) {
        try {
          return Date.now()/1000 - parseInt((JWT(userToken) as any).timestamp) < environment.userTokenExpiry;
        } catch (error) {
        }
      }
    } catch (error) {
        // console.error('Invalid token');
    }
    return false;
  }

  getRole(): string {
    const userToken = localStorage.getItem('userToken');
    if (userToken) {
      try {
        return (JWT(userToken) as any).role;
      } catch (error) {

      }
      return '';
    }
  }

  getUsername(): string {
    const userToken = localStorage.getItem('userToken');
    if (userToken) {
      try {
        return (JWT(userToken) as any).name;
      } catch (error) {
      }
      return '';
    }
  }

  getToken(): string {
    if (this.getUserToken()) {
      return this.getUserToken();
    } else if (this.getDeviceToken()) {
      return this.getDeviceToken();
    }
  }

  getUserToken(): string {
    return localStorage.getItem('userToken');
  }

  updateUserToken(token: string) {
    localStorage.setItem('userToken', token);
    try {
      JWT(localStorage.getItem('userToken'));
      return this.isSessionValidSubject.next(true);
    } catch (error) {}
    return this.isSessionValidSubject.next(false);
  }

  isSessionValid(): Observable<boolean> {
    return this.isSessionValidSubject.pipe(startWith(this.isLoggedIn()));
  }

  getDeviceToken() {
    return localStorage.getItem('deviceToken');
  }

  registerDevice(registrationCode: string): Observable<boolean> {
    const headers = new HttpHeaders({'Content-Type': 'application/json'});
    return this.http.post('/api/user/register_device', JSON.stringify({registration_code: registrationCode}), {headers}).pipe(
      map((response: any) => {
        // login successful if there's a jwt token in the response
        if (response.device_token) {
          localStorage.setItem('deviceToken', response.device_token);
          this.eventService.connect();
          this.isDeviceRegisteredSubject.next(true);
          return true;
        }

        return false;
      }));
  }

  unRegisterDevice() {
    localStorage.removeItem('deviceToken');
  }

  isDeviceRegistered(): Observable<boolean> {
    return this.isDeviceRegisteredSubject.pipe(
      startWith(!!localStorage.getItem('deviceToken'))
    );
  }
}
