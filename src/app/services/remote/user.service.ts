import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { User } from '@app/models';

@Injectable()
export class UserService {
  constructor(private http: HttpClient) {}

  getUsers(): Observable<User[]> {
    // get users from api
    return this.http.get<User[]>('/api/users');
  }

  getUser(userId: number): Observable<User> {
    // get users from api
    return this.http.get<User>('/api/user/' + userId);
  }

  getUserName(userId: number): Observable<string> {
    // get users from api
    return this.http.get<string>('/api/user/' + userId + '/name');
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

  generateRegistrationCode(userId: number, expiry: number): Observable<any> {
    let params = new HttpParams();
    if (expiry) {
      params = params.set('expiry', expiry.toString());
    }

    return this.http.get('/api/user/' + userId + '/registration_code', { params });
  }

  deleteRegistrationCode(userId: number): Observable<object> {
    return this.http.delete('/api/user/' + userId + '/registration_code');
  }

  registerCard(userId: number): Observable<any> {
    return this.http.put('/api/user/' + userId + '/register_card', {});
  }

  generateSshKey(userId: number, keyType: string, passphrase: string): Observable<string> {
    return this.http.post('/api/user/' + userId + '/ssh_key', { keyType, passphrase }).pipe(map((res: any) => res));
  }

  setPublicKey(userId: number, publicKey: string): Observable<boolean> {
    return this.http.put('/api/user/' + userId + '/ssh_key', { publicKey }).pipe(map((res: any) => res));
  }

  hasSshKey(userId: number): Observable<boolean> {
    return this.http.get('/api/user/' + userId + '/has_ssh_key').pipe(map((res: any) => res));
  }

  deleteSshKey(userId: number): Observable<boolean> {
    return this.http.delete('/api/user/' + userId + '/ssh_key').pipe(map((res: any) => res));
  }
}
