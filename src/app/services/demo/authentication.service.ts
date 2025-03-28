import { Inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, Subject } from 'rxjs';
import { delay, map, startWith } from 'rxjs/operators';

import { UserService } from './user.service';
import { User } from '@app/models';
import { environment } from '@environments/environment';
import { getSessionValue, setSessionValue, setLocalValue, getLocalValue } from '@app/utils';

@Injectable()
export class AuthenticationService {

  loggedInAs: User;
  registeredUserId: number;

  private isDeviceRegisteredSubject = new Subject<boolean>();
  private sessionValidSubject = new Subject<boolean>();

  constructor(
    @Inject('UserService') private userService: UserService,
    private router: Router
  ) {
    this.loggedInAs = getSessionValue('AuthenticationService.loggedInAs', null);
    this.registeredUserId = getLocalValue('AuthenticationService.registeredForUser', -1);
  }

  login(access_code: string): Observable<boolean> {
    const userId = getLocalValue('AuthenticationService.registeredForUser', null);
    const tmpUser = this.userService.users.find(user => user.id === userId);
    if (tmpUser && String(tmpUser.accessCode) === access_code) {
      this.loggedInAs = tmpUser;
      setSessionValue('AuthenticationService.loggedInAs', this.loggedInAs);
      this.updateUserToken('user.session');
      return of(true).pipe(delay(environment.delay));
    }

    return of(false).pipe(delay(environment.delay));
  }

  logout(manualAction: boolean = true): void {
    this.loggedInAs = null;
    this.updateUserToken(null);
    sessionStorage.removeItem('AuthenticationService.loggedInAs');
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
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

  getUser() {
    return this.loggedInAs;
  }

  updateUserToken(token: string) {
    this.sessionValidSubject.next(!!this.loggedInAs);
  }

  isSessionValid(): Observable<boolean> {
    return this.sessionValidSubject.asObservable().pipe(startWith(false));
  }

  getDeviceToken() {
    return 'device.token';
  }

  registerDevice(registrationCode: string): Observable<boolean> {
    const tmpUser = this.userService.users.find(user => String(user.registrationCode) === registrationCode);
    const index = this.userService.users.indexOf(tmpUser);
    if (tmpUser) {
      tmpUser.registrationCode = null;
      tmpUser.registrationExpiry = null;
      tmpUser.hasRegistrationCode = false;
      this.userService.updateUser(tmpUser);

      this.registeredUserId = tmpUser.id;
      setLocalValue('AuthenticationService.registeredForUser', this.registeredUserId);
      this.isDeviceRegisteredSubject.next(true);
    }

    return of( !!tmpUser ).pipe(delay(environment.delay));
  }

  unRegisterDevice(){
    this.registeredUserId = -1;
    setLocalValue('AuthenticationService.registeredForUser', this.registeredUserId);
    this.isDeviceRegisteredSubject.next(false);
  }

  isDeviceRegistered(): Observable<boolean> {
    return this.isDeviceRegisteredSubject.asObservable().pipe(startWith(this.registeredUserId >=0));
  }
}
