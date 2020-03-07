import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { User } from '../models';
import { AuthenticationService } from '../services/authentication.service';

@Injectable()
export class UserService {
  constructor(
    private http: HttpClient,
    private authService: AuthenticationService
  ) { }


  getUsers(): Observable<User[]> {
    // get users from api
    return this.http.get<User[]>('/api/users');
  }


  getUser(userId: number): Observable<User> {
    // get users from api
    return this.http.get<User>('/api/user/' + userId);
  }


  createUser(user: User): Observable<User> {
    // set sensor from api
    return this.http.post<User>('/api/users', user);
  }

  updateUser(user: User): Observable<User> {
    // set sensor from api
    return this.http.put<User>('/api/user/' + user.id, user);
  }

  deleteUser(userId: number): Observable<boolean> {
    // set sensor from api
    return this.http.delete<boolean>('/api/user/' + userId);
  }

  generateRegistrationCode(userId: number, expiry: string) {
    const params = new HttpParams();
    if (expiry) {
      params.set('expiry', expiry);
    }

    return this.http.get('/api/user/'+userId+'/registration_code', {params: params});
  }

  deleteRegistrationCode(userId: number) {
    return this.http.delete('/api/user/'+userId+'/registration_code');
  }
}
