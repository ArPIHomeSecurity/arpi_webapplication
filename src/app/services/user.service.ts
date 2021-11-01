import { Observable } from 'rxjs';

import { User } from '../models';


export interface UserService {

  getUsers(): Observable<User[]>;

  getUser(userId: number): Observable<User>;

  createUser(user: User): Observable<User>;

  updateUser(user: User): Observable<User>;

  deleteUser(userId: number): Observable<boolean>;

  generateRegistrationCode(userId: number, expiry: number): Observable<any>;

  deleteRegistrationCode(userId: number): Observable<object>;

  registerCard(userId: number): Observable<any>;
}
