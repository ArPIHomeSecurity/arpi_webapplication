import { Component, OnInit, ElementRef, ViewChild, Inject, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { App as CapacitorApp } from '@capacitor/app';

import { finalize } from 'rxjs/operators';

import { AuthenticationService, UserService } from '@app/services';
import { AUTHENTICATION_SERVICE } from '@app/tokens';
import { HttpErrorResponse } from '@angular/common/http';
import { CapacitorService } from '@app/services/capacitor.service';
import { Subscription } from 'rxjs';



@Component({
  styleUrls: ['login.component.scss'],
  templateUrl: 'login.component.html'
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

  goBackSubscription: Subscription;

  constructor(
    @Inject(AUTHENTICATION_SERVICE) private authenticationService: AuthenticationService,
    @Inject('UserService') private userService: UserService,
    @Inject('CapacitorService') private capacitorService: CapacitorService,
    private router: Router
  ) {

  }

  ngOnInit() {
    this.goBackSubscription = this.capacitorService.listenBackButton().subscribe(() => {
      console.log('Pressed backButton - on login');
      CapacitorApp.exitApp();
    });

    if (this.authenticationService.isLoggedIn()) {
      this.router.navigate(["/"]);
    }

    this.authenticationService.isDeviceRegistered()
      .subscribe(isRegistered => {
        this.isRegistered = isRegistered;

        if (isRegistered) {
          this.userService.getUserName(this.authenticationService.getRegisteredUserId()).subscribe(userName => {
            this.userName = userName;
          });
        }

        setTimeout (() => {
          if (isRegistered) {
            this.accessCodeField?.nativeElement.focus();
          } else {
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
      registerCode: this.registerCode = new FormControl('', Validators.required)
    });
    this.loginForm = new FormGroup({
      accessCode: this.accessCode = new FormControl('', Validators.required)
    });
  }

  register() {
    this.loading = true;
    this.error = '';

    if (this.registerCode.value) {
      const re  = /-/gi;
      this.authenticationService.registerDevice(this.registerCode.value.replace(re, ''))
        .pipe(finalize(() => this.loading = false))
        .subscribe({
          next: result => {
            this.registerCode.setValue(null);
            if (result) {
              setTimeout (() => {
                this.loginForm.reset();
                this.accessCodeField.nativeElement.focus();
              }, 0.5);
            } else {
              this.error = 'invalid registration code';
            }
            this.loading = false;
          },
          error: error => {
            console.log('Failed to register device', error);
            if (error instanceof HttpErrorResponse && error.status === 0) {
              this.error = 'no connection';
            }
            else if (error && 'error' in error && 'error' in error.error) {
              this.error = error.error.error;
            }
            else {
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

  login() {
    this.loading = true;
    this.error = '';

    if (this.accessCode.value) {
      this.authenticationService.login(this.accessCode.value)
        .pipe(finalize(() => this.loading = false))
        .subscribe({
          next: result => {
            this.accessCode.setValue(null);
            if (result) {
              // after login navigate to returnUrl or home
              const returnUrl = JSON.parse(localStorage.getItem('returnUrl'));
              this.router.navigate([returnUrl || '/']);
            } else {
              this.error = 'invalid access code';
              this.loading = false;
            }
          },
          error: error => {
            console.log('Failed to login', error);
            if (error instanceof HttpErrorResponse && error.status === 0) {
              this.error = 'no connection';
            }
            else if (error && 'error' in error && 'error' in error.error) {
              this.error = error.error.error;
            }
            else {
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
}
