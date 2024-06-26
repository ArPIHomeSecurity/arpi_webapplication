import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';

import { User } from '@app/models';
import { environment } from '@environments/environment';
import { getSessionValue, setSessionValue } from '@app/utils';
import { USERS } from '@app/demo/configuration';

export class UserDemo extends User {
  registrationCode: string;
  registeringCards: boolean;
}


@Injectable()
export class UserService {

  public users: UserDemo[];

  constructor(
  ) {
    this.users = getSessionValue('UserService.users', USERS);
  }

  getUsers(): Observable<UserDemo[]> {
    return of(this.users)
      .pipe(
        delay(environment.delay),
        map(_ => {
          // this.authService.updateUserToken('user.session');
          return _;
        })
      );
  }

  getUser(userId: number): Observable<UserDemo> {
    return of(this.users.find(u => u.id === userId))
      .pipe(
        delay(environment.delay),
        map(_ => {
          // this.authService.updateUserToken('user.session');
          return _;
        })
      );
  }

  createUser(user: User): Observable<User> {
    user.id = Math.max.apply(Math.max, this.users.map(u => u.id).concat([0])) + 1;
    this.users.push(Object.assign(new UserDemo(), user));
    setSessionValue('UserService.users', this.users);
    return of(user);
  }

  updateUser(user: User): Observable<User> {
    const tmpUser = this.users.find(u => u.id === user.id);
    const index = this.users.indexOf(tmpUser);
    this.users[index] = Object.assign(new UserDemo(), user);
    setSessionValue('UserService.users', this.users);
    return of(user);
  }

  deleteUser(userId: number): Observable<boolean> {
    this.users = this.users.filter(u => u.id !== userId);
    setSessionValue('UserService.users', this.users);
    return of(true);
  }

  generateRegistrationCode(userId: number, expiry: number): Observable<any> {
    const tmpUser = this.users.find(u => u.id === userId);
    const index = this.users.indexOf(tmpUser);
    let code = Math.random().toString(26).substring(2, 16).toUpperCase();
    while (code.length !== 12) {
      code = Math.random().toString(26).substring(2, 16).toUpperCase();
    }

    this.users[index].registrationCode = code;
    this.users[index].hasRegistrationCode = true;
    if (expiry) {
      const t = new Date();
      t.setSeconds(t.getSeconds() + expiry);
      this.users[index].registrationExpiry = t.toLocaleString();
    }
    else {
      this.users[index].registrationExpiry = '';
    }
    setSessionValue('UserService.users', this.users);
    return of({code});
  }

  deleteRegistrationCode(userId: number): Observable<boolean> {
    const tmpUser = this.users.find(u => u.id === userId);
    const index = this.users.indexOf(tmpUser);
    delete this.users[index].registrationCode;
    delete this.users[index].registrationExpiry;
    this.users[index].hasRegistrationCode = false;
    setSessionValue('UserService.users', this.users);
    return of(true);
  }

  registerCard(userId: number): Observable<any> {
    this.users[this.users.findIndex(u => u.id === userId)].registeringCards = true;
    setSessionValue('UserService.users', this.users);
    return of(true);
  }
}
