
import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

import { Observable, Subject, of } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { jwtDecode } from "jwt-decode";

import { EventService } from './event.service';

import { environment } from '@environments/environment';

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
    const prefix = this.getInstallationId();
    return this.http.post(
        '/api/user/authenticate',
        JSON.stringify({device_token: localStorage.getItem(`${prefix}:deviceToken`), access_code: accessCode}),
        {headers}
      )
      .pipe(
        map((response: any) => {
          // login successful if there's a jwt token in the response
          if (response.device_token) {
            localStorage.setItem(`${prefix}:deviceToken`, response.device_token);
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
    const prefix = this.getInstallationId();
    localStorage.removeItem(`${prefix}:userToken`);
    // clear returnUrl to start from home
    localStorage.removeItem('returnUrl');
    this.isSessionValidSubject.next(false);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    try {
      const userToken = this.getUserToken();
      if (userToken) {
        try {
          return Date.now()/1000 - parseInt((jwtDecode(userToken) as any).timestamp) < environment.userTokenExpiry;
        } catch (error) {
        }
      }
    } catch (error) {
        // console.error('Invalid token');
    }
    return false;
  }

  getRole(): string {
    const userToken = this.getUserToken();
    if (userToken) {
      try {
        return (jwtDecode(userToken) as any).role;
      } catch (error) {

      }
      return '';
    }
  }

  getUsername(): string {
    const userToken = this.getUserToken();
    if (userToken) {
      try {
        return (jwtDecode(userToken) as any).name;
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

  getInstallationId(): string {
    const installationId = parseInt(localStorage.getItem('selectedInstallationId'));
    if (installationId === null) {
      return;
    }
    const installations = JSON.parse(localStorage.getItem('installations'));
    if (!installations) {
      return;
    }
    const installation = installations.find(installation => installation.id === installationId);
    if (installation) {
      return installation.installation_id;
    }
  }

  getUserToken(): string {
    const prefix = this.getInstallationId();
    if (!prefix) {
      return;
    }
    return localStorage.getItem(`${prefix}:userToken`);
  }

  updateUserToken(token: string) {
    const prefix = this.getInstallationId();
    if (!prefix) {
      return;
    }
    localStorage.setItem(`${prefix}:userToken`, token);
    try {
      jwtDecode(this.getUserToken());
      return this.isSessionValidSubject.next(true);
    } catch (error) {}
    return this.isSessionValidSubject.next(false);
  }

  isSessionValid(): Observable<boolean> {
    return this.isSessionValidSubject.pipe(startWith(this.isLoggedIn()));
  }

  getDeviceToken() {
    const prefix = this.getInstallationId();
    return localStorage.getItem(`${prefix}:deviceToken`);
  }

  registerDevice(registrationCode: string): Observable<boolean> {
    const headers = new HttpHeaders({'Content-Type': 'application/json'});
    const prefix = this.getInstallationId();
    return this.http.post('/api/user/register_device', JSON.stringify({registration_code: registrationCode}), {headers}).pipe(
      map((response: any) => {
        // login successful if there's a jwt token in the response
        if (response.device_token) {
          localStorage.setItem(`${prefix}:deviceToken`, response.device_token);
          this.eventService.connect();
          this.isDeviceRegisteredSubject.next(true);
          return true;
        }

        return false;
      }));
  }

  unRegisterDevice() {
    const prefix = this.getInstallationId();
    localStorage.removeItem(`${prefix}:deviceToken`);
    localStorage.removeItem(`${prefix}:userToken`);
    this.isDeviceRegisteredSubject.next(false);
  }

  isDeviceRegistered(): Observable<boolean> {
    return this.isDeviceRegisteredSubject.pipe(
      startWith(!!this.getDeviceToken()) 
    );
  }
}
