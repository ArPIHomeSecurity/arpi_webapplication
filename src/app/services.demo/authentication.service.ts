import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';


import * as JWT from 'jwt-decode';
import { EventService } from '../services/event.service';
import { UserService } from './user.service';
import { User } from '../models';
import { environment } from '../../environments/environment';
import { getSessionValue, setSessionValue } from '../utils';

@Injectable()
export class AuthenticationService {

  loggedInAs: User;

  constructor(
      private eventService: EventService,
      private userService: UserService
  ) {
    this.loggedInAs = getSessionValue('AuthenticationService.loggedInAs', null);
  }

  login(access_code: string): Observable<boolean> {
    const foundUsers = this.userService.users.filter(user => String(user.access_code) === access_code);
    if (foundUsers.length > 0) {
      this.loggedInAs = foundUsers[0];
      setSessionValue('AuthenticationService.loggedInAs', this.loggedInAs);
    }

    return of( foundUsers.length === 1 ).delay(environment.delay);
  }

  logout(): void {
    this.loggedInAs = null;
    sessionStorage.removeItem('AuthenticationService.loggedInAs');
  }

  isLoggedIn() {
    const res = this.loggedInAs != null;
    return res;
  }

  getRole(): string {
    if (this.loggedInAs != null) {
      return this.loggedInAs.role;
    }
  }

  getUsername(): string {
    if (this.loggedInAs != null) {
      return this.loggedInAs.name;
    }
  }

  getToken(): string {
    return 'secret-token';
  }
}
