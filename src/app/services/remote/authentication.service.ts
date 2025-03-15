
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
    const locationId = this.getLocationId();
    const deviceTokens = JSON.parse(localStorage.getItem('deviceTokens')) || {};
    return this.http.post(
        '/api/user/authenticate',
        JSON.stringify({device_token: deviceTokens[locationId], access_code: accessCode}),
        {headers}
      )
      .pipe(
        map((response: any) => {
          // login successful if there's a jwt token in the response
          if (response.device_token) {
            // save in new format
            const deviceTokens = JSON.parse(localStorage.getItem('deviceTokens')) || {};
            deviceTokens[locationId] = response.device_token;
            localStorage.setItem('deviceTokens', JSON.stringify(deviceTokens));

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
    const locationId = this.getLocationId();
    const userTokens = JSON.parse(localStorage.getItem('userTokens')) || {};
    if (locationId in userTokens) {
      delete userTokens[locationId];
    }
    localStorage.setItem('userTokens', JSON.stringify(userTokens));

    // clear returnUrl to start from home
    localStorage.removeItem('returnUrl');
    this.isSessionValidSubject.next(false);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    try {
      const userToken = this.getUserToken();
      return !!userToken;
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

  getUserId(): number {
    const userToken = this.getUserToken();
    if (userToken) {
      try {
        return (jwtDecode(userToken) as any).id;
      } catch (error) {
      }
    }
  }

  getToken(): string {
    if (this.getUserToken()) {
      return this.getUserToken();
    } else if (this.getDeviceToken()) {
      return this.getDeviceToken();
    }
  }

  getLocationId(): string {
    return localStorage.getItem('selectedLocationId');
  }

  /**
   * Retrieves the user token if there is a valid token for the current location.
   * If the token is in the old format, it will be converted to the new format.
   * If the token is expired, it will be removed.
   */
  getUserToken(): string {
    const locationId = this.getLocationId();
    if (!locationId) {
      return;
    }

    const userToken = localStorage.getItem(`${locationId}:userToken`);
    if (!userToken) {
      // check in new format
      const userTokens = JSON.parse(localStorage.getItem('userTokens')) || {};
      return userTokens[locationId];
    }

    // save in new format
    const userTokens = JSON.parse(localStorage.getItem('userTokens')) || {};
    userTokens[locationId] = userToken;
    localStorage.setItem('userTokens', JSON.stringify(userTokens));

    // remove old format
    localStorage.removeItem(`${locationId}:userToken`);

    // parse token
    var userData;
    try {
      userData = jwtDecode(userToken);
    }
    catch (error) {
      console.error('Invalid token');
      return;
    }

    // check expiry
    if (Date.now()/1000 - parseInt(userData.timestamp) > environment.userTokenExpiry) {
      // remove token
      const userTokens = JSON.parse(localStorage.getItem('userTokens')) || {};
      if (locationId in userTokens) {
        delete userTokens[locationId];
      }

      this.isSessionValidSubject.next(false);
      return;
    }

    return userToken;
  }

  updateUserToken(token: string) {
    const locationId = this.getLocationId();
    if (!locationId) {
      return;
    }
    
    try {
      // check if token is valid
      jwtDecode(token);

      // save in new format
      const userTokens = JSON.parse(localStorage.getItem('userTokens')) || {};
      userTokens[locationId] = token;
      localStorage.setItem('userTokens', JSON.stringify(userTokens));

      // remove old format
      localStorage.removeItem(`${locationId}:userToken`);

      return this.isSessionValidSubject.next(true);
    } catch (error) {}
    return this.isSessionValidSubject.next(false);
  }

  isSessionValid(): Observable<boolean> {
    return this.isSessionValidSubject.pipe(startWith(this.isLoggedIn()));
  }

  /**
   * Retrieves the device token for the given location or the current.
   * @param locationId Optional location id.
   * @returns 
   */
  getDeviceToken(locationId?: string): string {
    if (!locationId) {
      locationId = this.getLocationId();
    }

    if (!locationId) {
      return;
    }

    const deviceToken = localStorage.getItem(`${locationId}:deviceToken`);
    if (!deviceToken) {
      // check in new format
      const deviceTokens = JSON.parse(localStorage.getItem('deviceTokens')) || {};
      return deviceTokens[locationId];
    }

    // save in new format
    const deviceTokens = JSON.parse(localStorage.getItem('deviceTokens')) || {};
    deviceTokens[locationId] = deviceToken;
    localStorage.setItem('deviceTokens', JSON.stringify(deviceTokens));

    // remove old format
    localStorage.removeItem(`${locationId}:deviceToken`);

    return deviceToken;
  }

  registerDevice(registrationCode: string): Observable<boolean> {
    const headers = new HttpHeaders({'Content-Type': 'application/json'});
    const locationId = this.getLocationId();
    return this.http.post('/api/user/register_device', JSON.stringify({registration_code: registrationCode}), {headers}).pipe(
      map((response: any) => {
        // login successful if there's a jwt token in the response
        if (response.device_token) {
          // save in new format
          const deviceTokens = JSON.parse(localStorage.getItem('deviceTokens')) || {};
          deviceTokens[locationId] = response.device_token;
          localStorage.setItem('deviceTokens', JSON.stringify(deviceTokens));

          this.eventService.connect();
          this.isDeviceRegisteredSubject.next(true);
          return true;
        }

        return false;
      }));
  }

  unRegisterDevice() {
    const locationId = this.getLocationId();

    // remove device token
    const deviceTokens = JSON.parse(localStorage.getItem('deviceTokens')) || {};
    if (locationId in deviceTokens) {
      delete deviceTokens[locationId];
    }
    localStorage.setItem('deviceTokens', JSON.stringify(deviceTokens));

    // remove user token
    const userTokens = JSON.parse(localStorage.getItem('userTokens')) || {};
    if (locationId in userTokens) {
      delete userTokens[locationId];
    }
    localStorage.setItem('userTokens', JSON.stringify(userTokens));

    // invalidate session
    this.isSessionValidSubject.next(false);
    this.isDeviceRegisteredSubject.next(false);

    // clear returnUrl to start from home
    localStorage.removeItem('returnUrl');
  }

  isDeviceRegistered(): Observable<boolean> {
    return this.isDeviceRegisteredSubject.pipe(
      startWith(!!this.getDeviceToken()) 
    );
  }

  getRegisteredUserId(): number {
    const userToken = this.getDeviceToken();
    if (userToken) {
      try {
        return (jwtDecode(userToken) as any).user_id;
      } catch (error) {
      }
    }
  }
}
