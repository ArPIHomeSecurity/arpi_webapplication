import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthenticationService } from '../services';

@Component({
  moduleId: module.id,
  styleUrls: ['login.component.scss'],
  templateUrl: 'login.component.html'
})

export class LoginComponent implements OnInit {
  name = new FormControl();
  registration_code = new FormControl();
  accessCode = new FormControl();
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
      .subscribe(isRegistered => this.isRegistered = isRegistered);
  }

  login() {
    this.loading = true;
    this.error = '';
    console.log("Login", this)
    if (this.accessCode.value) {
      this.authenticationService.login(this.accessCode.value)
        .subscribe(result => {
          if (result) {
            this.router.navigate(['/']);
          } else {
            this.error = 'Incorrect access code!';
            this.loading = false;
          }
        });
    }else if (this.name.value && this.registration_code.value) {
      this.authenticationService.registerDevice(this.name.value, this.registration_code.value)
        .subscribe(result => {
          if (result) {
            // this.router.navigate(['/']);
          } else {
            this.error = 'Incorrect name or password!';
          }
          this.loading = false;
        });
    }
    else {
      this.error = 'Fill fields!';
      this.loading = false;
    }
  }
}
