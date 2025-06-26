import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';

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

  logout(manualAction = true): void {
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
