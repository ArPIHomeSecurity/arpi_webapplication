import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { User } from '../models/index';
import { AuthenticationService } from '../services/authentication.service';

@Injectable()
export class UserService {
  constructor(
    private http: HttpClient,
    private authService: AuthenticationService
  ) { }


  getUsers(): Observable<User[]> {
    // add authorization header with jwt token
    const headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authService.getToken()});

    // get users from api
    return this.http.get<User[]>('/api/users', {headers});
  }


  getUser(userId: number): Observable<User> {
    // add authorization header with jwt token
    const headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authService.getToken()});

    // get users from api
    return this.http.get<User>('/api/user/' + userId, {headers});
  }


  createUser(user: User): Observable<User> {
    // add authorization header with jwt token
    const headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authService.getToken()});

    // set sensor from api
    return this.http.post<User>('/api/users', user, {headers});
  }

  updateUser(user: User): Observable<User> {
    // add authorization header with jwt token
    const headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authService.getToken()});

    // set sensor from api
    return this.http.put<User>('/api/user/' + user.id, user, {headers});
  }

  deleteUser(userId: number): Observable<boolean> {
    // add authorization header with jwt token
    const headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authService.getToken()});

    // set sensor from api
    return this.http.delete<boolean>('/api/user/' + userId, {headers});
  }

  
  changeAccessCode(userId: number, acccessCode: string): Observable<boolean> {
    // add authorization header with jwt token
    const headers = new HttpHeaders({'Authorization': 'Bearer ' + this.authService.getToken()});

    return this.http.put<boolean>('/api/user/' + userId, acccessCode, {headers});
  }
}
