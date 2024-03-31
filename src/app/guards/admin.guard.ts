import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AUTHENTICATION_SERVICE } from '@app/tokens';


export const AdminGuard: CanActivateFn = (router, state) => {
  const authService = inject(AUTHENTICATION_SERVICE);

  if (authService.isLoggedIn()) {
    if (authService.getRole() === 'admin') {
      return true;
    }
    else {
      // not admin so navigate to home
      inject(Router).navigate(['/']);
      return false;
    }
  }

  // store active URL, so user can be redirected after login
  localStorage.setItem('returnUrl', JSON.stringify(state.url));
  inject(Router).navigate(['/login']);
  return false;
};
