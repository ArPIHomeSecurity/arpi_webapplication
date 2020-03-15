import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, Subject } from 'rxjs';
import { delay, map, startWith } from 'rxjs/operators';

import { UserService } from './user.service';
import { User } from '../models';
import { environment } from '../../environments/environment';
import { getSessionValue, setSessionValue, setLocalValue, getLocalValue } from '../utils';

@Injectable()
export class AuthenticationService {

  private _isDeviceRegisteredSubject = new Subject<boolean>();
  private _sessionValidSubject = new Subject<boolean>();

  loggedInAs: User;
  registeredUserId: number;

  constructor(
      private router: Router,
      private userService: UserService
  ) {
    this.loggedInAs = getSessionValue('AuthenticationService.loggedInAs', null);
    this.registeredUserId = getLocalValue('AuthenticationService.registeredForUser', -1);
  }

  login(access_code: string): Observable<boolean> {
    const userId = getLocalValue('AuthenticationService.registeredForUser', null);
    const tmpUser = this.userService.users.find(user => user.id === userId);
    if (tmpUser && String(tmpUser.access_code) === access_code) {
      this.loggedInAs = tmpUser;
      setSessionValue('AuthenticationService.loggedInAs', this.loggedInAs);
      this.updateUserToken('user.session');
      return of(true).pipe(delay(environment.delay));
    }

    return of(false).pipe(delay(environment.delay));
  }

  logout(): void {
    this.loggedInAs = null;
    this.updateUserToken(null);
    sessionStorage.removeItem('AuthenticationService.loggedInAs');
    this.router.navigate(['/login']);
  }

  isLoggedIn() {
    const res = this.loggedInAs != null;
    return res;
  }

  getRole(): string {
    if (this.loggedInAs != null) {
      return this.loggedInAs.role;
    }
  }

  getUsername(): string {
    if (this.loggedInAs != null) {
      return this.loggedInAs.name;
    }
  }

  getToken(): string {
    return 'token';
  }

  getUserToken(): string {
    return 'user.token';
  }

  updateUserToken(token: string) {
    this._sessionValidSubject.next(!!this.loggedInAs);
  }

  isSessionValid(): Observable<boolean> {
    return this._sessionValidSubject.asObservable().pipe(startWith(false));
  }

  getDeviceToken() {
    return 'device.token';
  }

  registerDevice(registration_code: string): Observable<boolean> {
    const tmpUser = this.userService.users.find(user => String(user.registration_code) === registration_code);
    const index = this.userService.users.indexOf(tmpUser);
    if (tmpUser) {
      tmpUser.registration_code = null;
      tmpUser.registration_expiry = null;
      tmpUser.has_registration_code = false;
      this.userService.updateUser(tmpUser);

      this.registeredUserId = tmpUser.id;
      setLocalValue('AuthenticationService.registeredForUser', this.registeredUserId);
      this._isDeviceRegisteredSubject.next(true);
    }

    return of( !!tmpUser ).pipe(delay(environment.delay));
  }

  unRegisterDevice(){
    this.registeredUserId = -1;
    setLocalValue('AuthenticationService.registeredForUser', this.registeredUserId);
    this._isDeviceRegisteredSubject.next(false);
  }

  isDeviceRegistered(): Observable<boolean> {
    return this._isDeviceRegisteredSubject.asObservable().pipe(startWith(this.registeredUserId >=0));
  }
}
