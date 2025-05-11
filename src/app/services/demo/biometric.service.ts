import { Injectable } from '@angular/core';


@Injectable({
  providedIn: 'root'
})
export class BiometricService {
  constructor() { }

  isAvailable(): Promise<boolean> {
    return Promise.resolve(false);
  }

  getAccessCode(server: string): Promise<number | undefined> {
    return Promise.resolve(undefined);
  }

  setAccessCode(server: string, accessCode: number): Promise<void> {
    return Promise.resolve();
  }

  async verifyIdentity(): Promise<boolean> {
    return Promise.resolve(false);
  }
}
