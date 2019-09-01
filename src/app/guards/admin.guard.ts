import { Injectable } from '@angular/core';
import { Router, CanActivate} from '@angular/router';
import { AuthenticationService } from '../services';

@Injectable()
export class AdminGuard implements CanActivate {

  constructor(
      private authService: AuthenticationService,
      private router: Router,
  ) {}

  canActivate() {
    if (this.authService.isLoggedIn() && this.authService.getRole() === 'admin') {
      // logged in with "admin" role so return true
      return true;
    }

    // not "admin" redirect to home
    this.router.navigate(['/']);
    return false;
  }
}
