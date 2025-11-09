import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { environment } from '@environments/environment';

export const setupGuard: CanActivateFn = (route, state) => {
  const locations = localStorage.getItem('locations');
  const selectedLocationId = localStorage.getItem('selectedLocationId');
  if (locations && selectedLocationId != null) {
    return true;
  } else {
    if (!environment.isMultiLocation) {
      // Redirect to a setup page or any other desired route
      return inject(Router).createUrlTree(['/location/add']);
    }
    // in case of multi-location, allow access to location list
    // which will guide the user to set up locations
    return true;
  }
};
