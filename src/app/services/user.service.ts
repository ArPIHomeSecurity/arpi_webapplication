import { Observable } from 'rxjs';

import { User } from '@app/models';


export interface UserService {

  getUsers(): Observable<User[]>;

  getUser(userId: number): Observable<User>;

  getUserName(userId: number): Observable<string>;

  createUser(user: User): Observable<User>;

  updateUser(user: User): Observable<User>;

  deleteUser(userId: number): Observable<boolean>;

  generateRegistrationCode(userId: number, expiry: number): Observable<any>;

  deleteRegistrationCode(userId: number): Observable<object>;

  registerCard(userId: number): Observable<any>;

  generateSshKey(userId: number, keyType: string, passphrase: string): Observable<string>;

  setPublicKey(userId: number, publicKey: string): Observable<boolean>;

  hasSshKey(userId: number): Observable<boolean>;

  deleteSshKey(userId: number): Observable<boolean>;
}
