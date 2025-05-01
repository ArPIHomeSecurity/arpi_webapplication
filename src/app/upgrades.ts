import { _isNumberValue } from "@angular/cdk/coercion";


class Installation {
  id: number;
  installationId: string | null;
  version: string;
  name: string;
  scheme: string = 'https';
  primaryDomain: string = '';
  primaryPort: number = null;
  secondaryDomain: string = '';
  secondaryPort: number = null;
  order: number = 0;
}


export function upgradeInstallationsToLocations() {
  var locations = JSON.parse(localStorage.getItem('locations')) || [];

  if (locations.length > 0) {
    console.log('Already upgraded from installations to locations');
    return;
  }

  const installations = JSON.parse(localStorage.getItem('installations')) || [];
  installations.forEach(installation => {
    locations.push({
      id: installation.installationId,
      name: installation.name,
      scheme: installation.scheme,
      primaryDomain: installation.primaryDomain,
      primaryPort: installation.primaryPort,
      secondaryDomain: installation.secondaryDomain,
      secondaryPort: installation.secondaryPort,
      order: installation.order
    });

  });

  localStorage.setItem('locations', JSON.stringify(locations));

  var selectedInstallationId = localStorage.getItem('selectedInstallationId');
  if (selectedInstallationId !== null) {
    const selectedLocation = installations[parseInt(selectedInstallationId)];
    localStorage.setItem('selectedLocationId', selectedLocation.installationId);
  }

  // remove installations
  localStorage.removeItem('installations');
  localStorage.removeItem('selectedInstallationId');
}