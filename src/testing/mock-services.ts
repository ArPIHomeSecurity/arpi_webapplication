import { Injectable } from '@angular/core';
import { ARM_TYPE, Clocks, KeypadType, MONITORING_STATE, POWER_STATE, User } from '@app/models';
import { BehaviorSubject, Observable, of } from 'rxjs';

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

/**
 * Mock Monitoring Service for testing
 */
@Injectable()
export class MockMonitoringService {
  isAlert(): Observable<boolean> {
    return of(false);
  }

  getArmState(): Observable<ARM_TYPE> {
    return of(ARM_TYPE.DISARMED);
  }

  arm(armtype: ARM_TYPE): Observable<Object> {
    return of({ success: true, armType: armtype });
  }

  disarm(): Observable<Object> {
    return of({ success: true });
  }

  getMonitoringState(): Observable<MONITORING_STATE> {
    return of(MONITORING_STATE.READY);
  }

  getVersion(): Observable<string> {
    return of('1.0.0-test');
  }

  getClock(): Observable<Clocks> {
    const clock = new Clocks();
    clock.system = new Date().toISOString();
    clock.network = new Date().toISOString();
    clock.timezone = 'UTC';
    return of(clock);
  }

  synchronizeClock(): Observable<any> {
    return of({ success: true });
  }

  changeClock(dateTime: string, timeZone: string): Observable<any> {
    return of({ success: true, dateTime, timeZone });
  }

  getKeypadTypes(): Observable<KeypadType[]> {
    return of([
      { id: 1, name: 'Test Keypad 1' },
      { id: 2, name: 'Test Keypad 2' }
    ] as KeypadType[]);
  }

  getPowerState(): Observable<POWER_STATE> {
    return of(POWER_STATE.NETWORK);
  }
}

/**
 * Mock Authentication Service for testing
 */
@Injectable()
export class MockAuthenticationService {
  private isDeviceRegisteredSubject = new BehaviorSubject<boolean>(true);
  private isSessionValidSubject = new BehaviorSubject<boolean>(true);

  login(accessCode: number): Observable<boolean> {
    return of(true);
  }

  logout(manualAction: boolean = true): void {
    this.isSessionValidSubject.next(false);
    // Mock logout behavior
  }

  isLoggedIn(): boolean {
    return true;
  }

  getRole(): string {
    return 'admin';
  }

  getUsername(): string {
    return 'Test User';
  }

  getUserId(): number {
    return 1;
  }

  getToken(): string {
    return 'mock-jwt-token';
  }

  getLocationId(): string {
    return 'test-location-1';
  }

  getUserToken(): string {
    return 'mock-user-token';
  }

  updateUserToken(token: string): void {
    this.isSessionValidSubject.next(true);
  }

  isSessionValid(): Observable<boolean> {
    return this.isSessionValidSubject.asObservable();
  }

  getDeviceToken(locationId?: string): string {
    return 'mock-device-token';
  }

  registerDevice(registrationCode: string): Observable<boolean> {
    this.isDeviceRegisteredSubject.next(true);
    return of(true);
  }

  unRegisterDevice(): void {
    this.isSessionValidSubject.next(false);
    this.isDeviceRegisteredSubject.next(false);
  }

  isDeviceRegistered(): Observable<boolean> {
    return this.isDeviceRegisteredSubject.asObservable();
  }

  getRegisteredUserId(): number {
    return 1;
  }

  getDeviceDomain(): string {
    return 'test.domain.com';
  }
}
