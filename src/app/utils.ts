import { ValidatorFn, ValidationErrors } from '@angular/forms';
import { AbstractControl } from '@angular/forms';


export function positiveInteger(): ValidatorFn {
  return (control: AbstractControl): {[key: string]: any} => {
    const error: ValidationErrors = { integer: true };
    if (Number(control.value) < 0 || isNaN(Number(control.value))) {
      return {invalid: 'Should be a positive value!'};
    } else {
      return null;
    }
  };
}

export function getSessionValue(name: string, defaultValue: any): any {
  const value = JSON.parse(sessionStorage.getItem(name));
  if (value != null) {
    return value;
  }

  return defaultValue;
}

export function getLocalValue(name: string, defaultValue: any): any {
  const value = JSON.parse(localStorage.getItem(name));
  if (value != null) {
    return value;
  }

  return defaultValue;
}

export function setSessionValue(name: string, value: any) {
  sessionStorage.setItem(name, JSON.stringify(value));
}

export function setLocalValue(name: string, value: any) {
  localStorage.setItem(name, JSON.stringify(value));
}

export function getValue(value: any, attribute: string, defaultValue: any = '') {
  // console.log("Getting attribute:",value,".",attribute," = ",value[attribute]);
  if (value) {
    return (value[attribute] !== null) ? value[attribute] : defaultValue;
  }

  return defaultValue;
}

export const checkUrl = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'OPTIONS' });
    if (!response.ok) {
      console.error('No connection to the security system: ', url);
      return false;
    }
    console.log('Connected to the security system: ', url);
    return true;
  } catch (error) {
    console.error('Failed to connect to the security system: ', url, 'Error: ', error);
    return false;
  }
}

export const createHash = async (text: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(await hashBuffer));
  const hashHex = hashArray.map(b => ('00' + b.toString(16)).slice(-2)).join('');
  return hashHex;
}

/**
 * Load the domains and check which one is available.
 * Set the base domain to the first available one.
 */
export async function configureBackend(): Promise<void>{
  return new Promise(async (resolve, reject) => {
    try {
      const installations = JSON.parse(localStorage.getItem('installations'));
      const selectedInstallationId = parseInt(localStorage.getItem('selectedInstallationId'));
      const backendDomain = localStorage.getItem('backend.domain');

      if (installations && selectedInstallationId !== null) {
        const installation = installations.find(i => i.id === selectedInstallationId);
        if (installation) {
          if (installation.primaryDomain) {
            const primaryURL = `${installation.scheme}://${installation.primaryDomain}:${installation.primaryPort}/api/version`;
            const primaryAvailable = await checkUrl(primaryURL);
            if (primaryAvailable && backendDomain !== installation.primaryDomain) {
              console.log('Primary domain is available: ', installation.primaryDomain);
              localStorage.setItem('backend.scheme', installation.scheme);
              window.dispatchEvent(new StorageEvent('storage', { key: 'backend.domain', newValue: installation.primaryDomain }));

              localStorage.setItem('backend.domain', installation.primaryDomain);
              window.dispatchEvent(new StorageEvent('storage', { key: 'backend.port', newValue: installation.primaryPort }));

              localStorage.setItem('backend.port', installation.primaryPort);
              window.dispatchEvent(new StorageEvent('storage', { key: 'backend.scheme', newValue: installation.scheme }));

              console.log('Connected to: ', primaryURL);
              resolve();
              return;
            }
            else if (backendDomain === installation.primaryDomain) {
              console.log('Already connected to primary domain', installation.primaryDomain);
              resolve();
              return;
            }
          }

          if (installation.secondaryDomain) {
            const secondaryURL = `${installation.scheme}://${installation.secondaryDomain}:${installation.secondaryPort}/api/version`;
            const secondaryAvailable = await checkUrl(secondaryURL);
            if (secondaryAvailable && backendDomain !== installation.secondaryDomain) {
              console.log('Secondary domain is available: ', installation.secondaryDomain);
              localStorage.setItem('backend.scheme', installation.scheme);
              window.dispatchEvent(new StorageEvent('storage', { key: 'backend.domain', newValue: installation.secondaryDomain }));

              localStorage.setItem('backend.domain', installation.secondaryDomain);
              window.dispatchEvent(new StorageEvent('storage', { key: 'backend.port', newValue: installation.secondaryPort }));

              localStorage.setItem('backend.port', installation.secondaryPort);
              window.dispatchEvent(new StorageEvent('storage', { key: 'backend.scheme', newValue: installation.scheme }));
              console.log('Connected to: ', secondaryURL);
              resolve();
              return;
            }
            else if (backendDomain === installation.secondaryDomain) {
              console.log('Already connected to secondary domain', installation.secondaryDomain);
              resolve();
              return;
            }
          }
        }
      }
      console.log('No valid installation found or no domains available');
      localStorage.removeItem('backend.scheme');
      localStorage.removeItem('backend.domain');
      localStorage.removeItem('backend.port');
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}
