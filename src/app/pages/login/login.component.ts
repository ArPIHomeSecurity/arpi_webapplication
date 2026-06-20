import { Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { App as CapacitorApp } from '@capacitor/app';

import { finalize } from 'rxjs/operators';

import { HttpErrorResponse } from '@angular/common/http';
import { AuthenticationService, BiometricService, UserService } from '@app/services';
import { CapacitorService } from '@app/services/capacitor.service';
import { AUTHENTICATION_SERVICE } from '@app/tokens';
import { Subscription } from 'rxjs';


@Component({
  styleUrls: ['login.component.scss'],
  templateUrl: 'login.component.html',
  standalone: false
})
export class LoginComponent implements OnInit, OnDestroy {
  @ViewChild('registration_code_field') registrationCodeField: ElementRef;
  @ViewChild('access_code_field') accessCodeField: ElementRef;

  registerForm: FormGroup;
  registerCode: FormControl;
  loginForm: FormGroup;
  accessCode: FormControl;
  isRegistered = false;
  loading = false;
  error = '';
  hide = true;
  userName = '';

  // identify intentional logout to avoid biometric login after logout
  isLogout = false;

  goBackSubscription: Subscription;

  // is the user logged in
  isLoggedIn = false;
  // biometric is available on the platform
  isBiometricAvailable = false;
  // biometric is enabled for the selected location
  // null means not set yet, true means enabled, false means disabled
  isBiometricEnabled: boolean | null = false;
  // biometric login is running
  isBiometricRunning = false;

  constructor(
    @Inject(AUTHENTICATION_SERVICE) private authenticationService: AuthenticationService,
    @Inject('BiometricService') private biometricService: BiometricService,
    @Inject('UserService') private userService: UserService,
    @Inject('CapacitorService') private capacitorService: CapacitorService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.isLogout = this.route.snapshot.queryParams.isLogout === 'true';
  }

  ngOnInit() {
    this.goBackSubscription = this.capacitorService.listenBackButton().subscribe(() => {
      console.debug('Pressed backButton - on login');
      CapacitorApp.exitApp();
    });

    if (this.authenticationService.isLoggedIn()) {
      this.router.navigate(['/']);
    }

    this.authenticationService.isDeviceRegistered().subscribe(isRegistered => {
      this.isRegistered = isRegistered;

      if (isRegistered) {
        this.userService
          .getUserName(this.authenticationService.getRegisteredUserId())
          .subscribe(userName => (this.userName = userName));
      }

      setTimeout(async () => {
        if (isRegistered) {
          this.accessCodeField?.nativeElement.focus();

          this.biometricService.isAvailable().then(isAvailable => {
            this.isBiometricAvailable = isAvailable;
            if (isAvailable) {
              const status = JSON.parse(localStorage.getItem('biometricEnabled')) || {};
              const locationId = localStorage.getItem('selectedLocationId');
              const useBiometric = status[locationId];
              console.debug('Biometric status:', JSON.stringify(status), locationId, useBiometric, typeof useBiometric);

              if (useBiometric === true) {
                // allowed
                this.isBiometricEnabled = true;

                // start biometric login only if not logout
                if (!this.isLogout) {
                  this.loginBiometric();
                }
              } else if (useBiometric === false) {
                // not allowed so use the manual login
                this.isBiometricEnabled = false;
              } else {
                // available so ask the user to allow it after successful login
                this.isBiometricEnabled = null;
              }
            }
          });
        } else {
          // not registered so do the registration
          this.registrationCodeField?.nativeElement.focus();
        }
      }, 0.5);
    });

    this.updateForms();
  }

  ngOnDestroy() {
    if (this.goBackSubscription) {
      this.goBackSubscription.unsubscribe();
    }
  }

  updateForms() {
    this.registerForm = new FormGroup({
      registerCode: (this.registerCode = new FormControl('', Validators.required))
    });
    this.loginForm = new FormGroup({
      accessCode: (this.accessCode = new FormControl('', Validators.required))
    });
  }

  canRegister() {
    return !this.isRegistered;
  }

  register() {
    this.loading = true;
    this.error = '';

    if (this.registerCode.value) {
      const re = /-/gi;
      this.authenticationService
        .registerDevice(this.registerCode.value.replace(re, ''))
        .pipe(finalize(() => (this.loading = false)))
        .subscribe({
          next: result => {
            this.registerCode.setValue(null);
            if (result) {
              setTimeout(() => {
                this.loginForm.reset();
                this.accessCodeField.nativeElement.focus();
              }, 0.5);
            } else {
              this.error = 'invalid registration code';
            }
            this.loading = false;
          },
          error: error => {
            console.error('Failed to register device', error);
            if (error instanceof HttpErrorResponse && error.status === 0) {
              this.error = 'no connection';
            } else if (error && 'error' in error && 'error' in error.error) {
              this.error = error.error.error;
            } else {
              this.error = 'no connection';
            }
            this.loading = false;
          }
        });
    } else {
      this.loading = false;
      this.error = 'invalid form';
    }
  }

  askLogin() {
    return (
      this.isRegistered && !this.isLoggedIn && !this.isBiometricRunning
    );
  }

  loginManually() {
    this.loading = true;
    this.error = '';

    if (this.accessCode.value) {
      this.authenticationService
        .login(this.accessCode.value)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe({
          next: result => {
            if (result) {
              this.isLoggedIn = true;
              if (this.isBiometricEnabled !== null) {
                // biometric already allowed or not available so just navigate forward
                this.navigateForward();
              }
              else {
                // ask the user to allow biometric
                this.isBiometricRunning = true;
              }
            } else {
              this.error = 'invalid access code';
              this.accessCode.setValue(null);
            }
          },
          error: error => {
            console.error('Failed to login', error);
            if (error instanceof HttpErrorResponse && error.status === 0) {
              this.error = 'no connection';
            } else if (error && 'error' in error && 'error' in error.error) {
              this.error = error.error.error;
            } else {
              this.error = 'no connection';
            }
          }
        });
    } else {
      this.loading = false;
      this.error = 'invalid form';
    }
  }

  /**
   * Navigate forward after successful login or registration.
   * Go to returnUrl if set, otherwise go to home page.
   */
  private navigateForward() {
    const returnUrl = JSON.parse(localStorage.getItem('returnUrl'));
    console.debug('Navigating to', returnUrl);
    if (returnUrl === '/login' || !returnUrl) {
      this.router.navigate(['/']);
      return;
    }

    this.router.navigate([returnUrl]);
  }

  canAskBiometric() {
    return this.isBiometricAvailable && this.isBiometricEnabled === null && this.isLoggedIn;
  }

  canLoginWithBiometric() {
    return this.isBiometricAvailable && this.isBiometricEnabled && !this.isBiometricRunning;
  }

  runningLoginWithBiometric() {
    return this.isBiometricAvailable && this.isBiometricEnabled && this.isBiometricRunning;
  }

  async loginBiometric() {
    console.debug('start biometric login');
    this.loading = true;
    this.isBiometricRunning = true;
    const verified = await this.biometricService.verifyIdentity();
    if (!verified) {
      this.isBiometricEnabled = false;
      this.loading = false;
      this.isBiometricRunning = false;
      return;
    }

    const locationId = localStorage.getItem('selectedLocationId');
    if (!locationId) {
      console.error('Location ID is not set');
      return;
    }

    const accessCode = await this.biometricService.getAccessCode(locationId);
    if (accessCode) {
      this.authenticationService
        .login(accessCode)
        .pipe(finalize(() => {
          this.loading = false;
          this.isBiometricRunning = false;
        }))
        .subscribe({
          next: result => {
            console.debug('Biometric login result:', result);
            if (result) {
              this.navigateForward();
            } else {
              this.error = 'invalid access code';
              this.isBiometricEnabled = false;
              localStorage.removeItem('biometricEnabled');
            }
          },
          error: error => {
            console.error('Failed to login', error);
            if (error instanceof HttpErrorResponse && error.status === 0) {
              this.error = 'no connection';
            } else if (error && 'error' in error && 'error' in error.error) {
              this.error = error.error.error;
              if (this.error === 'invalid access code') {
                // re-enable biometric login if the credentials are not found or if there is an error
                localStorage.removeItem('biometricEnabled');
                this.isBiometricEnabled = false;
              }
            } else {
              this.error = 'no connection';
            }
          }
        });
    } else {
      // re-enable biometric login if the credentials are not found or if there is an error
      localStorage.removeItem('biometricEnabled');
      this.isBiometricEnabled = false;
      this.isBiometricRunning = false;
    }
  }

  async saveAccessCode() {
    const accessCode = this.accessCode.value;
    if (accessCode) {
      const verified = await this.biometricService.verifyIdentity();
      if (!verified) {
        this.isBiometricEnabled = false;
        return;
      }

      const locationId = localStorage.getItem('selectedLocationId');
      if (!locationId) {
        console.error('Location ID is not set');
        return;
      }

      console.debug('Saving access code', accessCode, 'for location', locationId);
      // update component state
      this.biometricService.setAccessCode(locationId, accessCode);
      this.isBiometricEnabled = true;

      // update local storage
      const status = JSON.parse(localStorage.getItem('biometricEnabled')) || {};
      status[locationId] = true;
      localStorage.setItem('biometricEnabled', JSON.stringify(status));

      this.navigateForward();
    }
  }

  allowBiometric(enable: boolean) {
    const status: { [key: string]: boolean } = JSON.parse(localStorage.getItem('biometricEnabled')) || {};
    const locationId = localStorage.getItem('selectedLocationId');

    if (!locationId) {
      console.error('Location ID is not set');
      return;
    }

    status[locationId] = enable;
    console.debug('Biometric status:', JSON.stringify(status));
    localStorage.setItem('biometricEnabled', JSON.stringify(status));

    if (enable) {
      this.saveAccessCode();
    } else {
      this.navigateForward();
    }
  }
}
