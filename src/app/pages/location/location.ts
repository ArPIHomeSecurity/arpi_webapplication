import { forkJoin, Observable } from 'rxjs';
import { Location } from '@app/models';

/**
 * Location test result
 *
 * - undefined: no test run
 * - null: test running
 * - true: test passed
 * - false: test failed
 */
export class LocationTestResult {
  primary: boolean = null;
  secondary: boolean = null;
  primaryLocationId: string = null;
  primaryVersion: string = null;
  secondaryLocationId: string = null;
  secondaryVersion: string = null;
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

function loadLocationId(locationIdURL: string): Observable<string> {
  if (!locationIdURL) {
    return;
  }

  return new Observable<string>(observer => {
    fetch(locationIdURL)
      .then(response => {
        if (!response.ok) {
          observer.next(undefined);
          observer.complete();
          return;
        }

        return response.text();
      })
      .then(locationId => {
        // check response format
        // location id sha256
        if (typeof locationId !== 'string' || !/^[a-f0-9]{64}$/.test(locationId)) {
          console.error('Invalid location id', locationId.substring(0, 100));
          observer.next(undefined);
        } else {
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

export function getVersion(versionUrl: string): Observable<string> {
  if (!versionUrl) {
    return;
  }

  return new Observable<string>(observer => {
    fetch(versionUrl)
      .then(response => {
        if (!response.ok) {
          observer.next(undefined);
          observer.complete();
          return;
        }

        return response.text();
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

const undefinedObservableAny = new Observable<any>(observer => {
  observer.next(undefined);
  observer.complete();
});

const undefinedObservableBoolean = new Observable<boolean>(observer => {
  observer.next(undefined);
  observer.complete();
});

const undefinedObservableString = new Observable<string>(observer => {
  observer.next(undefined);
  observer.complete();
});

export function testLocation(location: Location): Observable<LocationTestResult> {
  if (!location) {
    return;
  }

  const testResult = new LocationTestResult();

  return new Observable<LocationTestResult>(observer => {
    let testPrimary: Observable<boolean>;
    if (location.primaryDomain !== '') {
      if (!location.primaryPort) {
        location.primaryPort = 443;
      }
      const primaryURL = `${location.scheme}://${location.primaryDomain}:${location.primaryPort}/api/version`;
      testPrimary = testUrl(primaryURL);
    } else {
      testResult.primary = undefined;
      testPrimary = undefinedObservableBoolean;
    }

    let testSecondary: Observable<boolean>;
    if (location.secondaryDomain !== '') {
      if (!location.secondaryPort) {
        location.secondaryPort = 443;
      }
      const secondaryURL = `${location.scheme}://${location.secondaryDomain}:${location.secondaryPort}/api/version`;
      testSecondary = testUrl(secondaryURL);
    } else {
      testResult.secondary = undefined;
      testSecondary = undefinedObservableBoolean;
    }

    let primaryLocationId: Observable<string>;
    if (location.primaryDomain !== '') {
      primaryLocationId = loadLocationId(
        `${location.scheme}://${location.primaryDomain}:${location.primaryPort}/api/config/installation_id`
      );
    } else {
      testResult.primaryLocationId = undefined;
      primaryLocationId = undefinedObservableString;
    }

    let secondaryLocationId: Observable<string>;
    if (location.secondaryDomain !== '') {
      secondaryLocationId = loadLocationId(
        `${location.scheme}://${location.secondaryDomain}:${location.secondaryPort}/api/config/installation_id`
      );
    } else {
      testResult.secondaryLocationId = undefined;
      secondaryLocationId = undefinedObservableString;
    }

    let primaryVersion: Observable<string>;
    if (location.primaryDomain !== '') {
      primaryVersion = getVersion(`${location.scheme}://${location.primaryDomain}:${location.primaryPort}/api/version`);
    } else {
      testResult.primaryVersion = undefined;
      primaryVersion = undefinedObservableString;
    }

    let secondaryVersion: Observable<string>;
    if (location.secondaryDomain !== '') {
      secondaryVersion = getVersion(
        `${location.scheme}://${location.secondaryDomain}:${location.secondaryPort}/api/version`
      );
    } else {
      testResult.secondaryVersion = undefined;
      secondaryVersion = undefinedObservableString;
    }

    forkJoin({
      primaryAvailable: testPrimary,
      secondaryAvailable: testSecondary,
      primaryLocationId: primaryLocationId,
      primaryVersion: primaryVersion,
      secondaryLocationId: secondaryLocationId,
      secondaryVersion: secondaryVersion
    }).subscribe(results => {
      testResult.primary = results.primaryAvailable;
      testResult.secondary = results.secondaryAvailable;
      testResult.primaryLocationId = results.primaryLocationId;
      testResult.primaryVersion = results.primaryVersion;
      testResult.secondaryLocationId = results.secondaryLocationId;
      testResult.secondaryVersion = results.secondaryVersion;
      observer.next(testResult);
      observer.complete();
    });
  });
}
