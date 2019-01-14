import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import 'rxjs/add/operator/delay';

import { User } from '../models/index';

import { USERS, environment } from '../../environments/environment.demo';


@Injectable()
export class UserService {

  public users: User[] = USERS;

  constructor(

  ) { }

  getUsers(): Observable<User[]> {
    return of(this.users).delay(environment.delay);
  }

  getUser(userId: number): Observable<User> {
    return of(this.users.find(u => u.id === userId)).delay(environment.delay);
  }

  createUser(user: User): Observable<User> {
    // set sensor from api
    return of(new User());
  }

  updateUser(user: User): Observable<User> {
    const tmpUser = this.users.find(u => u.id === user.id);
    const index = this.users.indexOf(tmpUser);
    this.users[index] = user;
    return of(user);
  }

  deleteUser(userId: number): Observable<boolean> {
    this.users = this.users.filter(u => u.id !== userId);
    return of(true);
  }
}
