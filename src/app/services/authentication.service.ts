import { Observable } from "rxjs"

export interface AuthenticationService {
  login(accessCode: number): Observable<boolean>

  logout(manualAction: boolean): void

  isLoggedIn(): boolean

  getRole(): string

  getUsername(): string

  getUserId(): number

  getToken(): string

  getUserToken(): string

  updateUserToken(token: string)

  isSessionValid(): Observable<boolean>

  getDeviceToken(locationId?: string): string

  registerDevice(registrationCode: string): Observable<boolean>

  unRegisterDevice(locationId?: string)

  isDeviceRegistered(): Observable<boolean>

  getDeviceDomain(): string

  getRegisteredUserId(): number
}
