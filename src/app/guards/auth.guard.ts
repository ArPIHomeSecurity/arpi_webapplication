import { Inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router, CanActivate} from '@angular/router';
import { AuthenticationService } from '../services';

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(
      @Inject('AuthenticationService') private authService: AuthenticationService,
      private router: Router,
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    if (this.authService.isLoggedIn()) {
      // logged in so return true
      return true;
    }

    // store active URL, so user can be redirected after login
    localStorage.setItem('returnUrl', JSON.stringify(state.url));

    // not logged in so redirect to login page
    this.router.navigate(['/login']);
    return false;
  }
}
