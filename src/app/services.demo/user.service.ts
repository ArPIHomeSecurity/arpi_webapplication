import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { User } from '../models/index';

@Injectable()
export class UserService {

  public users: User[] = [
    {
      id: 0,
      name: 'Administrator',
      role: 'admin',
      access_code: 1234
    },
    {
      id: 1,
      name: 'User 1',
      role: 'user',
      access_code: 1111
    }
  ];

  constructor(
    private http: HttpClient
  ) { }


  getUsers(): Observable<User[]> {
    // get users from api
    return this.http.get<User[]>('/api/users', { });
  }


  getUser(userId: number): Observable<User> {
    // get users from api
    return this.http.get<User>('/api/user/' + userId, { });
  }


  createUser(user: User): Observable<User> {
    // set sensor from api
    return this.http.post<User>('/api/users', user, { });
  }

  updateUser(user: User): Observable<User> {
    // set sensor from api
    return this.http.put<User>('/api/user/' + user.id, user, { });
  }

  deleteUser(userId: number): Observable<boolean> {
    // set sensor from api
    return this.http.delete<boolean>('/api/user/' + userId, { });
  }

  changeAccessCode(userId: number, acccessCode: string): Observable<boolean> {
    return this.http.put<boolean>('/api/user/' + userId, acccessCode, { });
  }
}
