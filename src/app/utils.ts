import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

import { Dialog } from '@capacitor/dialog';
import { Location } from './models';
import { upgradeInstallationsToLocations } from './upgrades';

// Global AbortController for backend configuration
let configurationAbortController: AbortController | null = null;

const showAlert = async (title: string, message: string) => {
  await Dialog.alert({
    title: title,
    message: message
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

  // clone the default value to avoid changing it through a reference
  let clonedDefaultValue = '';
  if (defaultValue && typeof defaultValue === 'object') {
    clonedDefaultValue = JSON.parse(JSON.stringify(defaultValue));
  } else {
    clonedDefaultValue = defaultValue;
  }

  if (value) {
    return value[attribute] !== null ? value[attribute] : clonedDefaultValue;
  }

  return clonedDefaultValue;
}

export const checkUrl = async (url: string, controller?: AbortController): Promise<boolean> => {
  const timeoutId = setTimeout(() => controller?.abort(), 15000);

  try {
    const response = await fetch(url, { method: 'OPTIONS', signal: controller?.signal });
    if (!response.ok) {
      console.error('No connection to the security system: ', url);
      return false;
    }
    console.log('Connected to the security system: ', url);
    return true;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error; // Propagate abort errors up
    }
    console.error('Failed to connect to the security system: ', url, 'Error:', error);
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const createHash = async (text: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(await hashBuffer));
  const hashHex = hashArray.map(b => ('00' + b.toString(16)).slice(-2)).join('');
  return hashHex;
};

/**
 * Check if the domain is available and set it as the base domain.
 *
 * @param scheme The URL scheme (e.g., http, https).
 * @param domain The domain object.
 * @param port The port number.
 * @param backendDomain The current backend domain.
 * @returns True if the domain is available and set, false otherwise.
 */
async function checkAndSetDomain(
  scheme: string,
  domain: string,
  port: string,
  backendDomain: string,
  controller?: AbortController
): Promise<boolean> {
  if (scheme && domain && port) {
    const url = `${scheme}://${domain}:${port}/api/version`;
    const available = await checkUrl(url, controller);

    if (available && backendDomain !== domain) {
      // if the backend and the domain are different, set the domain
      console.log(`Domain is available: `, domain);
      localStorage.setItem('backend.scheme', scheme);
      window.dispatchEvent(new StorageEvent('storage', { key: 'backend.domain', newValue: domain }));

      localStorage.setItem('backend.domain', domain);
      window.dispatchEvent(new StorageEvent('storage', { key: 'backend.port', newValue: port }));

      localStorage.setItem('backend.port', port);
      window.dispatchEvent(new StorageEvent('storage', { key: 'backend.scheme', newValue: scheme }));

      console.log('Connected to: ', url);
      return true;
    } else if (available && backendDomain === domain) {
      // if the backend and the domain are the same, do nothing
      console.log(`Already connected to domain`, domain);
      return true;
    } else if (!available) {
      console.error('Domain is not available: ', domain);
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
    upgradeInstallationsToLocations();

    try {
      // Create abort controller for this configuration attempt
      configurationAbortController = new AbortController();

      const locations: [Location] = JSON.parse(localStorage.getItem('locations')) || [];
      const selectedLocationId = localStorage.getItem('selectedLocationId');
      const backendDomain = localStorage.getItem('backend.domain');

      if (selectedLocationId) {
        const location: Location = locations.find(i => i.id === selectedLocationId);
        if (location) {
          const primaryAvailable = await checkAndSetDomain(
            location.scheme,
            location.primaryDomain,
            location.primaryPort?.toString(),
            backendDomain,
            configurationAbortController
          );
          if (primaryAvailable) {
            localStorage.setItem('backend.scheme', location.scheme);
            localStorage.setItem('backend.domain', location.primaryDomain);
            localStorage.setItem('backend.port', location.primaryPort.toString());
            configurationAbortController = null;
            resolve();
            return;
          }

          const secondaryAvailable = await checkAndSetDomain(
            location.scheme,
            location.secondaryDomain,
            location.secondaryPort?.toString(),
            backendDomain,
            configurationAbortController
          );
          if (secondaryAvailable) {
            localStorage.setItem('backend.scheme', location.scheme);
            localStorage.setItem('backend.domain', location.secondaryDomain);
            localStorage.setItem('backend.port', location.secondaryPort.toString());
            configurationAbortController = null;
            resolve();
            return;
          }
        }
      }

      console.warn('No accessible location found');
      localStorage.removeItem('backend.scheme');
      localStorage.removeItem('backend.domain');
      localStorage.removeItem('backend.port');
      configurationAbortController = null;
      resolve();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('Backend configuration was cancelled by user');
      } else {
        console.error('Failed to configure the backend: ', error);
      }

      localStorage.removeItem('backend.scheme');
      localStorage.removeItem('backend.domain');
      localStorage.removeItem('backend.port');
      configurationAbortController = null;
      resolve();
      return;
    }
  });
}

/**
 * Cancel the running backend configuration.
 * This aborts all pending HTTP requests made by configureBackend().
 */
export function abortBackendConfiguration(): void {
  if (configurationAbortController) {
    configurationAbortController.abort();
    configurationAbortController = null;
    console.log('Backend configuration cancelled');
  }
}

// Expose abort function globally for HTML scripts
(window as any).abortBackendConfiguration = abortBackendConfiguration;
