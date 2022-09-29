import { Inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router, CanActivate } from '@angular/router';
import { AuthenticationService } from '../services';


@Injectable()
export class AdminGuard implements CanActivate {

  constructor(
      @Inject('AuthenticationService') private authService: AuthenticationService,
      private router: Router,
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    if (this.authService.isLoggedIn()) {
      if (this.authService.getRole() === 'admin') {
        return true;
      }
      else {
        // not admin so navigate to home
        this.router.navigate(['/']);
        return false;
      }
    }
    
    // store active URL, so user can be redirected after login
    localStorage.setItem('returnUrl', JSON.stringify(state.url));
    this.router.navigate(['/login']);
    return false;
  }
}
