import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';


import * as JWT from 'jwt-decode';
import { EventService } from '../services/event.service';
import { UserService } from './user.service';
import { User } from '../models';

@Injectable()
export class AuthenticationService {

  loggedInAs: User = null;

  constructor(
      private eventService: EventService,
      private userService: UserService
  ) {
    const userId = sessionStorage.getItem('loggedInAs');
    if (userId != null) {
      const usersFound = this.userService.users.filter(u => u.id === Number(userId));
      this.loggedInAs = usersFound[0];
    }
  }

  login(access_code: string): Observable<boolean> {
    const foundUsers = this.userService.users.filter(user => String(user.access_code) === access_code);
    this.loggedInAs = foundUsers[0];

    sessionStorage.setItem('loggedInAs', String(this.loggedInAs.id));
    return of( foundUsers.length === 1 );
  }

  logout(): void {
    this.loggedInAs = null;
  }

  isLoggedIn() {
    return this.loggedInAs !== null;
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
