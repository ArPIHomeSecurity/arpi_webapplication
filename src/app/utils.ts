import { ValidatorFn, ValidationErrors } from '@angular/forms';
import { AbstractControl } from '@angular/forms';

import { Dialog } from '@capacitor/dialog';

const showAlert = async (title: string, message: string) => {
  await Dialog.alert({
    title: title,
    message: message,
  });
};


export function positiveInteger(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } => {
    const error: ValidationErrors = { integer: true };
    if (Number(control.value) < 0 || isNaN(Number(control.value))) {
      return { invalid: 'Should be a positive value!' };
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
    const response = await fetch(url, { method: 'OPTIONS', signal: AbortSignal.timeout(15000) });
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
 * Check if the domain is available and set it as the base domain.
 * 
 * @param installation The installation object.
 * @param type The type of the domain (primary or secondary).
 * @param backendDomain The current backend domain.
 * @returns True if the domain is available and set, false otherwise.
 */
async function checkAndSetDomain(installation, type, backendDomain) {
  const domainKey = `${type}Domain`;
  const portKey = `${type}Port`;
  if (installation[domainKey]) {
    const url = `${installation.scheme}://${installation[domainKey]}:${installation[portKey]}/api/version`;
    const available = await checkUrl(url);
    if (available && backendDomain !== installation[domainKey]) {
      console.log(`${type.charAt(0).toUpperCase() + type.slice(1)} domain is available: `, installation[domainKey]);
      localStorage.setItem('backend.scheme', installation.scheme);
      window.dispatchEvent(new StorageEvent('storage', { key: 'backend.domain', newValue: installation[domainKey] }));

      localStorage.setItem('backend.domain', installation[domainKey]);
      window.dispatchEvent(new StorageEvent('storage', { key: 'backend.port', newValue: installation[portKey] }));

      localStorage.setItem('backend.port', installation[portKey]);
      window.dispatchEvent(new StorageEvent('storage', { key: 'backend.scheme', newValue: installation.scheme }));

      console.log('Connected to: ', url);
      return true;
    } else if (backendDomain === installation[domainKey]) {
      console.log(`Already connected to ${type} domain`, installation[domainKey]);
      return true;
    }
  }
  return false;
}


/**
 * Load the domains and check which one is available. Set the base domain to the first available one.
 * 
 * @returns A promise that resolves when the backend is configured.
 * @throws An error if the backend cannot be configured.
 * @remarks The backend configuration is stored in the local storage.
 */
export async function configureBackend(): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const installations = JSON.parse(localStorage.getItem('installations'));
      const selectedInstallationId = parseInt(localStorage.getItem('selectedInstallationId'));
      const backendDomain = localStorage.getItem('backend.domain');

      if (installations && selectedInstallationId !== null) {
        const installation = installations.find(i => i.id === selectedInstallationId);
        if (installation) {
          const primaryAvailable = await checkAndSetDomain(installation, 'primary', backendDomain);
          if (primaryAvailable) {
            resolve();
            return;
          }

          const secondaryAvailable = await checkAndSetDomain(installation, 'secondary', backendDomain);
          if (secondaryAvailable) {
            resolve();
            return;
          }
        }
      }

      console.warn('No valid installation found or no domains available');
      localStorage.removeItem('backend.scheme');
      localStorage.removeItem('backend.domain');
      localStorage.removeItem('backend.port');
      resolve();
    } catch (error) {
      console.error('Failed to configure the backend: ', error);
      resolve();
      return;
    }
  });
}
