import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';

@Injectable({
  providedIn: 'root'
})
export class BiometricService {
  constructor() {}

  isAvailable(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return Promise.resolve(false);
    }

    return NativeBiometric.isAvailable()
      .then(result => {
        if (result.isAvailable) {
          console.log('Biometric is available');
        }
        return result.isAvailable;
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
    const isAvailable = await this.isAvailable();

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
