import { forkJoin, Observable } from "rxjs";
import { Location } from "@app/models";


/**
 * Location test result
 * 
 * - null: test running
 * - true: test passed
 * - false: test failed
 */
export class LocationTestResult {
  primary: boolean = null
  secondary: boolean = null
  locationId: string = null;
}

function testUrl(url: string): Observable<boolean> {
  if (!url) {
    return;
  }

  return new Observable<boolean>(observer => {
    fetch(url, { method: 'OPTIONS', signal: AbortSignal.timeout(15000) })
      .then(response => {
        if (!response.ok) {
          console.error('No connection to the security system: ', url);
          observer.next(false);
        } else {
          console.log('Connected to the security system: ', url);
          observer.next(true);
        }
        observer.complete();
      })
      .catch(error => {
        console.error('Failed to connect to the security system: ', url, 'Error: ', error);
        observer.next(false);
        observer.complete();
      });
  });
}

function loadLocationId(location: Location): Observable<string> {
  if (!location) {
    return;
  }

  var locationIdURL = '';
  if (location.primaryDomain !== '') {
    locationIdURL = `${location.scheme}://${location.primaryDomain}:${location.primaryPort}/api/config/installation_id`;
  }
  else if (location.secondaryDomain !== '') {
    locationIdURL = `${location.scheme}://${location.secondaryDomain}:${location.secondaryPort}/api/config/installation_id`;
  }

  return new Observable<string>(observer => {
    fetch(locationIdURL)
      .then(response => {
        if (!response.ok) {
          observer.next(undefined);
          observer.complete();
          return;
        }

        return response.text()
      })
      .then(locationId => {
        // check response format
        // location id sha256
        if (typeof locationId !== 'string' || !/^[a-f0-9]{64}$/.test(locationId)) {
          console.error('Invalid location id', locationId.substring(0, 100));
          observer.next(undefined);
        } else {
          location.id = locationId;
          observer.next(locationId);
        }
        observer.complete();
      })
      .catch(error => {
        console.error('Error loading location id', {
          message: error.message,
          stack: error.stack,
          locationIdURL: locationIdURL
        });
        observer.next(undefined);
        observer.complete();
      });
  });
}


export function testLocation(location: Location): Observable<LocationTestResult> {
  if (!location) {
    return;
  }

  const testResult = new LocationTestResult();

  return new Observable<LocationTestResult>(observer => {
    var testPrimary: Observable<boolean>;
    if (location.primaryDomain !== '') {
      if (!location.primaryPort) {
        location.primaryPort = 443;
      }
      const primaryURL = `${location.scheme}://${location.primaryDomain}:${location.primaryPort}/api/version`;
      testPrimary = testUrl(primaryURL);
    } else {
      testResult.primary = undefined;
      testPrimary = new Observable<boolean>(observer => {
        observer.next(undefined);
        observer.complete();
      });
    }

    var testSecondary: Observable<boolean>;
    if (location.secondaryDomain !== '') {
      if (!location.secondaryPort) {
        location.secondaryPort = 443;
      }
      const secondaryURL = `${location.scheme}://${location.secondaryDomain}:${location.secondaryPort}/api/version`;
      testSecondary = testUrl(secondaryURL);

    } else {
      testResult.secondary = undefined;
      testSecondary = new Observable<boolean>(observer => {
        observer.next(undefined);
        observer.complete();
      });
    }

    forkJoin({
      primaryAvailable: testPrimary,
      secondaryAvailable: testSecondary,
      locationId: loadLocationId(location)
    })
    .subscribe((results) => {
      testResult.primary = results.primaryAvailable;
      testResult.secondary = results.secondaryAvailable;
      testResult.locationId = results.locationId;
      observer.next(testResult);
      observer.complete();
    });
  });
}

export function getVersion(location: Location): Observable<string> {
  if (!location) {
    return;
  }

  return new Observable<string>(observer => {
     var versionUrl = '';
    if (location.primaryDomain !== '') {
      versionUrl = `${location.scheme}://${location.primaryDomain}:${location.primaryPort}/api/version`;
    }
    else if (location.secondaryDomain !== '') {
      versionUrl = `${location.scheme}://${location.secondaryDomain}:${location.secondaryPort}/api/version`;
    }

    fetch(versionUrl)
      .then(response => {
        if (!response.ok) {
          observer.next(undefined);
          observer.complete();
          return;
        }
 
        return response.text()
      })
      .then(version => {
        observer.next(version);
        observer.complete();
      })
      .catch(error => {
        console.error('Error loading version', {
          message: error.message,
          stack: error.stack,
          url: versionUrl
        });
        observer.next(undefined);
        observer.complete();
      });
  });
}