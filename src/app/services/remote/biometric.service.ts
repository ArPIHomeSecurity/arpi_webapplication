import { Injectable } from '@angular/core';
import { AvailableResult, NativeBiometric } from '@capgo/capacitor-native-biometric';

@Injectable({
  providedIn: 'root'
})
export class BiometricService {
  constructor() {}

  isAvailable(): Promise<boolean> {
    return NativeBiometric.isAvailable()
      .then(() => {
        console.log('Biometric is available');
        return true;
      })
      .catch(e => {
        console.info('Biometric availability error:', e.message);
        return false;
      });
  }

  getAccessCode(server: string): Promise<number | undefined> {
    return NativeBiometric.getCredentials({
      server: server
    })
      .then(result => {
        console.log(result);
        return result.password;
      })
      .then(accessCode => {
        return parseInt(accessCode) || undefined;
      })
      .catch(error => {
        console.error('Error getting credentials:', error);
        return undefined;
      });
  }

  setAccessCode(server: string, accessCode: number): Promise<void> {
    return NativeBiometric.setCredentials({
      server: server,
      username: 'arpi',
      password: accessCode.toString()
    })
      .then(() => {
        console.log('Credentials set successfully');
      })
      .catch(error => {
        console.error('Error setting credentials:', error);
      });
  }

  async verifyIdentity(): Promise<boolean> {
    const isAvailable = await NativeBiometric.isAvailable();

    if (isAvailable) {
      return await NativeBiometric.verifyIdentity({
        title: $localize`:@@biometric title:Log in to ArPI Home Security`,
        maxAttempts: 2
      })
        .then(() => {
          console.log('Biometric verified');
          return true;
        })
        .catch(error => {
          console.error('Biometric verifying failed: ', error);
          return false;
        });
    } else {
      return false;
    }
  }
}
