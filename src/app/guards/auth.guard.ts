import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';

import { AUTHENTICATION_SERVICE } from '../tokens';

export const AuthGuard: CanActivateFn = () => {
  const authService = inject(AUTHENTICATION_SERVICE);
  return authService.isLoggedIn();
};
