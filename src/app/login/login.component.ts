import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { AuthenticationService } from '../services/index';

@Component({
  moduleId: module.id,
  styleUrls: ['login.component.scss'],
  templateUrl: 'login.component.html'
})

export class LoginComponent implements OnInit {
  model: any = {};
  loading = false;
  error = '';

  constructor(
    private router: Router,
    private authenticationService: AuthenticationService
    ) {}

  ngOnInit() {
    // reset login status
    this.authenticationService.logout();
  }

  login() {
    this.loading = true;
    this.authenticationService.login(this.model.access_code)
      .subscribe(result => {
        if (result === true) {
          this.router.navigate(['/']);
        } else {
          this.error = 'Incorrect access code!';
          this.loading = false;
        }
      });
  }
}
