import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

import { AuthenticationService } from '../services';
import { FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
  moduleId: module.id,
  styleUrls: ['login.component.scss'],
  templateUrl: 'login.component.html'
})

export class LoginComponent implements OnInit {
  @ViewChild('rc_field', {static: false}) rc_field: ElementRef;
  @ViewChild('ac_field', {static: false}) ac_field: ElementRef;

  registerForm: FormGroup;
  registerCode: FormControl;
  loginForm: FormGroup;
  accessCode: FormControl;
  isRegistered = false;
  loading = false;
  error = '';

  constructor(
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
            this.ac_field.nativeElement.focus();
          }
          else {
            this.rc_field.nativeElement.focus();
          }
        }, 0.5);
      });
    
    this.updateForms();
  }

  updateForms(){
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
      this.authenticationService.registerDevice(this.registerCode.value)
        .subscribe(result => {
          this.registerCode.setValue(null);
          if (result) {
            setTimeout (() => {
              this.loginForm.reset();
              this.ac_field.nativeElement.focus();
            }, 0.5);
          } else {
            this.error = 'Invalid registration code!';
          }
          this.loading = false;
        },
        error => {
          if (error.error['error'] == 'expired registration') {
            this.error = 'Registration code expired!';
          }
          else {
            this.error = 'Failed to register device!';
          }
          this.loading = false;
        }
      );
    }
    else {
      this.loading = false;
      this.error = 'Fill required field(s)!';
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
            let returnUrl = JSON.parse(localStorage.getItem('returnUrl'));
            this.router.navigate([returnUrl || '/']);
          } else {
            this.error = 'Incorrect access code!';
            this.loading = false;
          }
        },
        error => {
          if (error.error['error'] == 'invalid user id') {
            this.error = 'Registered user is unknown!';
          }
          else {
            this.error = 'Failed to authenticate!';
          }

          this.loading = false;
        }
      );
    }
    else {
      this.loading = false;
      this.error = 'Fill required field(s)!';
    }
  }

  unregister(){
    this.authenticationService.unRegisterDevice();
    this.isRegistered = false;
    this.accessCode.setValue(null);
    setTimeout (() => {
      this.registerForm.reset();
      this.rc_field.nativeElement.focus();
    }, 0.5);
  }
}
