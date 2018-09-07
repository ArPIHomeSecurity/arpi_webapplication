import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import { User } from '../models/index';
import { AuthenticationService } from '../services/authentication.service';

@Injectable()
export class UserService {
  constructor(
    private http: Http,
    private authService: AuthenticationService
  ) { }


  getUsers(): Observable<User[]> {
    // add authorization header with jwt token
    const token = this.authService.getToken();
    const headers = new Headers({'Authorization': 'Bearer ' + token});
    const options = new RequestOptions({headers: headers});

    // get users from api
    return this.http.get('/api/users', options)
      .map((response: Response) => response.json());
  }


  getUser(userId: number): Observable<User> {
    // add authorization header with jwt token
    const token = this.authService.getToken();
    const headers = new Headers({'Authorization': 'Bearer ' + token});
    const options = new RequestOptions({headers: headers});

    // get users from api
    return this.http.get('/api/user/' + userId, options)
      .map((response: Response) => response.json());
  }


  createUser(user: User): Observable<User> {
    // add authorization header with jwt token
    const token = this.authService.getToken();
    const headers = new Headers({'Authorization': 'Bearer ' + token});
    const options = new RequestOptions({headers: headers});

    // set sensor from api
    return this.http.post('/api/users', user, options)
      .map((response: Response) => response.json());
    }

  updateUser(user: User): Observable<User> {
    // add authorization header with jwt token
    const token = this.authService.getToken();
    const headers = new Headers({'Authorization': 'Bearer ' + token});
    const options = new RequestOptions({headers: headers});

    // set sensor from api
    return this.http.put('/api/user/' + user.id, user, options)
      .map((response: Response) => response.json());
  }

  deleteUser(userId: number): Observable<User> {
    // add authorization header with jwt token
    const token = this.authService.getToken();
    const headers = new Headers({'Authorization': 'Bearer ' + token});
    const options = new RequestOptions({headers: headers});

    // set sensor from api
    return this.http.delete('/api/user/' + userId, options)
      .map((response: Response) => response.json());
  }

  
  changeAccessCode(userId: number, acccessCode: string): Observable<User[]> {
    // add authorization header with jwt token
    const token = this.authService.getToken();
    const headers = new Headers({'Authorization': 'Bearer ' + token});
    const options = new RequestOptions({headers: headers});

    return this.http.put('/api/user/' + userId, acccessCode, options)
      .map((response: Response) => response.json());
  }
}
