import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';

// import { AuthenticationService } from './authentication.service';
import { User } from '../models';
import { environment, USERS } from '../../environments/environment';
import { getSessionValue, setSessionValue } from '../utils';

export class UserDemo extends User {
  registration_code: string;
}


@Injectable()
export class UserService {

  public users: UserDemo[];

  constructor(
    // private authService: AuthenticationService
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
    let newUser = Object.assign(new UserDemo, user);
    this.users.push(newUser);
    setSessionValue('UserService.users', this.users);
    return of(user);
  }

  updateUser(user: User): Observable<User> {
    const tmpUser = this.users.find(u => u.id === user.id);
    const index = this.users.indexOf(tmpUser);
    this.users[index] = Object.assign(new UserDemo, user);
    setSessionValue('UserService.users', this.users);
    return of(user);
  }

  deleteUser(userId: number): Observable<boolean> {
    this.users = this.users.filter(u => u.id !== userId);
    setSessionValue('UserService.users', this.users);
    return of(true);
  }

  generateRegistrationCode(userId: number, expiry: number): Observable<object> {
    const tmpUser = this.users.find(u => u.id === userId);
    const index = this.users.indexOf(tmpUser);
    let code = Math.random().toString(26).substring(2, 16).toUpperCase();
    while (code.length != 12) {
      code = Math.random().toString(26).substring(2, 16).toUpperCase();
    }

    this.users[index].registration_code = code;
    this.users[index].has_registration_code = true;
    if (expiry) {
      let t = new Date();
      t.setSeconds(t.getSeconds() + expiry);
      this.users[index].registration_expiry = t.toLocaleString();
    }
    else {
      this.users[index].registration_expiry = '';
    }
    setSessionValue('UserService.users', this.users);
    return of({code: code});
  }

  deleteRegistrationCode(userId: number): Observable<boolean> {
    const tmpUser = this.users.find(u => u.id === userId);
    const index = this.users.indexOf(tmpUser);
    delete this.users[index].registration_code;
    delete this.users[index].registration_expiry;
    this.users[index].has_registration_code = false;
    setSessionValue('UserService.users', this.users);
    return of(true);
  }
}
