import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';


export const setupGuard: CanActivateFn = (route, state) => {
    const locations = localStorage.getItem('locations');
    const selectedLocationId = localStorage.getItem('selectedLocationId');
    if (locations && selectedLocationId != null) {
        return true;
    } else {
        // Redirect to a setup page or any other desired route
        return inject(Router).createUrlTree(['/setup']);
    }
};
