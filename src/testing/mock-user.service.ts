import { Injectable } from '@angular/core';
import { User } from '@app/models';
import { Observable, of } from 'rxjs';

/**
 * Mock User Service for testing
 */
@Injectable()
export class MockUserService {
  getUsers(): Observable<User[]> {
    return of([
      { id: 1, name: 'Test User 1', email: 'user1@test.com' } as User,
      { id: 2, name: 'Test User 2', email: 'user2@test.com' } as User
    ]);
  }

  getUser(userId: number): Observable<User> {
    return of({
      id: userId,
      name: `Test User ${userId}`,
      email: `user${userId}@test.com`
    } as User);
  }

  getUserName(userId: number): Observable<string> {
    return of(`Test User ${userId}`);
  }

  createUser(user: User): Observable<User> {
    return of({ ...user, id: Math.floor(Math.random() * 1000) });
  }

  updateUser(user: User): Observable<User> {
    return of(user);
  }

  deleteUser(userId: number): Observable<boolean> {
    return of(true);
  }

  // Add other methods as needed
  getRegistrationCode(userId: number): Observable<string> {
    return of('mock-registration-code');
  }

  deleteRegistrationCode(userId: number): Observable<boolean> {
    return of(true);
  }
}
