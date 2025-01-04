import { Observable } from 'rxjs';


export interface AuthenticationService {

  login(accessCode: number): Observable<boolean>;

  logout(): void;

  isLoggedIn(): boolean;

  getRole(): string;

  getUsername(): string;

  getToken(): string;

  getUserToken(): string;

  updateUserToken(token: string);

  isSessionValid(): Observable<boolean>;

  getDeviceToken(installationId?: string): string;

  registerDevice(registrationCode: string): Observable<boolean>;

  unRegisterDevice();
  
  isDeviceRegistered(): Observable<boolean>;
 
  getRegisteredUserId(): number;
}
