import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router, CanActivate } from '@angular/router';
import { AuthenticationService } from '../services';

@Injectable()
export class AdminGuard implements CanActivate {

  constructor(
      private authService: AuthenticationService,
      private router: Router,
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    if (this.authService.isLoggedIn() && this.authService.getRole() === 'admin') {
      // Store last active URL prior to logout, so user can be redirected on re-login
      localStorage.setItem('returnUrl', JSON.stringify(state.url));

      // logged in with "admin" role so return true
      return true;
    }

    // not "admin" redirect to home
    this.router.navigate(['/']);
    return false;
  }
}
