import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AUTHENTICATION_SERVICE } from '../tokens';

export const AuthGuard: CanActivateFn = () => {
  const authService = inject(AUTHENTICATION_SERVICE);
  if (authService.isLoggedIn()) {
    return true;
  }

  inject(Router).navigate(['/login']);
};
