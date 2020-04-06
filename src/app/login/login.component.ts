import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';

import { AuthenticationService } from '../services';
import { UserDeviceUnregisterDialogComponent } from '../user';


@Component({
  styleUrls: ['login.component.scss'],
  templateUrl: 'login.component.html'
})

export class LoginComponent implements OnInit {
  @ViewChild('rc_field') rcField: ElementRef;
  @ViewChild('ac_field') acField: ElementRef;

  registerForm: FormGroup;
  registerCode: FormControl;
  loginForm: FormGroup;
  accessCode: FormControl;
  isRegistered = false;
  loading = false;
  error = '';
  hide = true;

  constructor(
    private dialog: MatDialog,
    private router: Router,
    private authenticationService: AuthenticationService
    ) {

    }

  ngOnInit() {
    this.authenticationService.isDeviceRegistered()
      .subscribe(isRegistered => {
        this.isRegistered = isRegistered;
        setTimeout (() => {
          if (isRegistered) {
            this.acField.nativeElement.focus();
          } else {
            this.rcField.nativeElement.focus();
          }
        }, 0.5);
      });

    this.updateForms();
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
        .subscribe(result => {
          this.registerCode.setValue(null);
          if (result) {
            setTimeout (() => {
              this.loginForm.reset();
              this.acField.nativeElement.focus();
            }, 0.5);
          } else {
            this.error = 'invalid registration code';
          }
          this.loading = false;
        },
        error => {
          this.error = error.error.error;
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
          this.error = error.error.error;
          this.loading = false;
        }
      );
    } else {
      this.loading = false;
      this.error = 'invalid form';
    }
  }

  unregister() {
    const dialogRef = this.dialog.open(UserDeviceUnregisterDialogComponent, {
      width: '250px',
      data: null,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.authenticationService.unRegisterDevice();
        this.isRegistered = false;
        this.accessCode.setValue(null);
        setTimeout (() => {
          this.registerForm.reset();
          this.rcField.nativeElement.focus();
        }, 0.5);
      }
    });
  }
}
