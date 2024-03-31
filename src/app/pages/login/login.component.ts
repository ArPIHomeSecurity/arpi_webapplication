import { Component, OnInit, ElementRef, ViewChild, Inject } from '@angular/core';
import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { finalize } from 'rxjs/operators';

import { AuthenticationService } from '@app/services';
import { AUTHENTICATION_SERVICE } from '@app/tokens';



@Component({
  styleUrls: ['login.component.scss'],
  templateUrl: 'login.component.html'
})

export class LoginComponent implements OnInit {
  @ViewChild('registration_code_field') registrationCodeField: ElementRef;
  @ViewChild('access_code_field') accessCodeField: ElementRef;

  registerForm: UntypedFormGroup;
  registerCode: UntypedFormControl;
  loginForm: UntypedFormGroup;
  accessCode: UntypedFormControl;
  isRegistered = false;
  loading = false;
  error = '';
  hide = true;

  constructor(
    @Inject(AUTHENTICATION_SERVICE) private authenticationService: AuthenticationService,
    private router: Router
    ) {

    }

  ngOnInit() {
    if (this.authenticationService.isLoggedIn()) {
      this.router.navigate(["/"]);
    }

    this.authenticationService.isDeviceRegistered()
      .subscribe(isRegistered => {
        this.isRegistered = isRegistered;
        setTimeout (() => {
          if (isRegistered) {
            this.accessCodeField.nativeElement.focus();
          } else {
            this.registrationCodeField.nativeElement.focus();
          }
        }, 0.5);
      });

    this.updateForms();
  }

  updateForms() {
    this.registerForm = new UntypedFormGroup({
      registerCode: this.registerCode = new UntypedFormControl('', Validators.required)
    });
    this.loginForm = new UntypedFormGroup({
      accessCode: this.accessCode = new UntypedFormControl('', Validators.required)
    });
  }

  register() {
    this.loading = true;
    this.error = '';

    if (this.registerCode.value) {
      const re  = /-/gi;
      this.authenticationService.registerDevice(this.registerCode.value.replace(re, ''))
        .pipe(finalize(() => this.loading = false))
        .subscribe(result => {
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
        error => {
          if (error && 'error' in error && 'error' in error.error) {
            this.error = error.error.error;
          }
          else {
            this.error = 'no connection';
          }
          this.loading = false;
        }
      );
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
        .subscribe(result => {
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
        error => {
          if (error && 'error' in error && 'error' in error.error) {
            this.error = error.error.error;
          }
          else {
            this.error = 'no connection';
          }
          this.loading = false;
        }
      );
    } else {
      this.loading = false;
      this.error = 'invalid form';
    }
  }
}
