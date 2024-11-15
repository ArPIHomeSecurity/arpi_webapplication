import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';


export const setupGuard: CanActivateFn = (route, state) => {
    const installations = localStorage.getItem('installations');
    const selectedInstallationId = localStorage.getItem('selectedInstallationId');
    if (installations && selectedInstallationId) {
        return true;
    } else {
        // Redirect to a setup page or any other desired route
        return inject(Router).createUrlTree(['/setup']);
    }
};
