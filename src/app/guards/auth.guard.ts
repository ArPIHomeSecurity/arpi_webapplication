import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router, CanActivate} from '@angular/router';
import { AuthenticationService } from '../services';

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(
      private authService: AuthenticationService,
      private router: Router,
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    if (this.authService.isLoggedIn()) {
      // Store last active URL prior to logout, so user can be redirected on re-login
      localStorage.setItem('returnUrl', JSON.stringify(state.url));

      // logged in so return true
      return true;
    }

    // not logged in so redirect to login page
    this.router.navigate(['/login']);
    return false;
  }
}
