import { Component, OnInit, ElementRef, ViewChild, Inject, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { App as CapacitorApp } from '@capacitor/app';

import { finalize } from 'rxjs/operators';

import { AuthenticationService, BiometricService, UserService } from '@app/services';
import { AUTHENTICATION_SERVICE } from '@app/tokens';
import { HttpErrorResponse } from '@angular/common/http';
import { CapacitorService } from '@app/services/capacitor.service';
import { Subscription } from 'rxjs';

enum BiometricStatus {
  Undefined, // not yet checked
  NotAvailable, // not available on the device
  Available, // available but not yet allowed
  PendingApproval, // waiting for user approval
  Enabled, // allowed and already in use
  Disabled, // not allowed
  AuthenticationFailed // failed to authenticate with biometric
}

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

  isLogout = false;

  goBackSubscription: Subscription;

  /**
   * Use biometric authentication
   */
  BIOMETRIC_STATUSES = BiometricStatus;
  useBiometric: BiometricStatus = BiometricStatus.Undefined;
  isBiometricAvailable = false;

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
            if (isAvailable) {
              this.isBiometricAvailable = true;
              const status = JSON.parse(localStorage.getItem('biometricEnabled')) || {};
              const locationId = localStorage.getItem('selectedLocationId');
              const useBiometric = status[locationId];
              console.debug('Biometric status:', JSON.stringify(status), locationId, useBiometric, typeof useBiometric);

              if (useBiometric === true) {
                // allowed
                this.useBiometric = BiometricStatus.Enabled;

                // start biometric login only if not logout
                if (!this.isLogout) {
                  this.biometricLogin();
                }
              } else if (useBiometric === false) {
                // not allowed so use the manual login
                this.useBiometric = BiometricStatus.Disabled;
              } else {
                // available so ask the user to allow it after successful login
                this.useBiometric = BiometricStatus.Available;
              }
            } else {
              // not available so normal login
              this.useBiometric = BiometricStatus.NotAvailable;
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

  getBiometricStatus(): BiometricStatus {
    const status: Map<string, BiometricStatus> = JSON.parse(localStorage.getItem('biometricEnabled'));
    const locationId = localStorage.getItem('selectedLocationId');
    return status.get(locationId) || BiometricStatus.Undefined;
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

  canLoginManually() {
    return (
      this.isRegistered &&
      (this.useBiometric === BiometricStatus.Disabled ||
        this.useBiometric === BiometricStatus.Available ||
        this.useBiometric === BiometricStatus.NotAvailable ||
        this.useBiometric === BiometricStatus.AuthenticationFailed ||
        this.isLogout)
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
              if (
                this.useBiometric === BiometricStatus.Enabled ||
                this.useBiometric === BiometricStatus.NotAvailable ||
                this.useBiometric === BiometricStatus.Disabled ||
                this.useBiometric === BiometricStatus.AuthenticationFailed ||
                this.isLogout
              ) {
                // already allowed or not available so just navigate forward
                this.navigateForward();
              } else if (this.useBiometric === BiometricStatus.Available) {
                // ask the user to allow biometric
                this.useBiometric = BiometricStatus.PendingApproval;
              }
            } else {
              this.error = 'invalid access code';
              this.loading = false;
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
            this.loading = false;
          }
        });
    } else {
      this.loading = false;
      this.error = 'invalid form';
    }
  }

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
    return this.useBiometric === BiometricStatus.PendingApproval && !this.isLogout;
  }

  canStartLoginWithBiometric() {
    return this.isBiometricAvailable && this.useBiometric === BiometricStatus.Enabled;
  }

  canLoginWithBiometric() {
    return this.useBiometric === BiometricStatus.Enabled && !this.isLogout;
  }

  async biometricLogin() {
    console.debug('start biometric login');
    this.loading = true;
    const verified = await this.biometricService.verifyIdentity();
    if (!verified) {
      this.useBiometric = BiometricStatus.AuthenticationFailed;
      this.loading = false;
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
        .pipe(finalize(() => (this.loading = false)))
        .subscribe({
          next: result => {
            console.debug('Biometric login result:', result);
            if (result) {
              this.navigateForward();
            } else {
              this.error = 'invalid access code';
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
      this.useBiometric = BiometricStatus.AuthenticationFailed;
    }
  }

  async saveAccessCode() {
    const accessCode = this.accessCode.value;
    if (accessCode) {
      const verified = await this.biometricService.verifyIdentity();
      if (!verified) {
        this.useBiometric = BiometricStatus.AuthenticationFailed;
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
      this.useBiometric = BiometricStatus.Enabled;

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
