import { Component, Inject, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { User } from '../models';
import { UserService } from '../services';

import { environment } from '../../environments/environment';


@Component({
  selector: 'app-user-device-registration-dialog',
  templateUrl: 'user-device-registration.component.html',
  styleUrls: ['user-device-registration.component.scss'],
})
export class UserDeviceRegistrationDialogComponent implements OnInit {
  @ViewChild('snackbarTemplate') snackbarTemplate: TemplateRef<any>;

  registrationForm: FormGroup;
  modes: any[];
  units: any[];
  registrationCode: string;

  constructor(
    @Inject('UserService') public userService: UserService,
    public dialogRef: MatDialogRef<UserDeviceRegistrationDialogComponent>, @Inject(MAT_DIALOG_DATA) public user: User,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private clipboard: Clipboard
  ) {
    this.modes = [
      {name: $localize`:@@device code no expiry:Unlimited time`, value: 'no_expiry'},
      {name: $localize`:@@device code with expiry:With expiry`, value: 'expiry'}
    ];
    this.units = [
      {value: 'hours', viewValue: $localize`:@@expiry hours:Hours`},
      {value: 'days', viewValue: $localize`:@@expiry days:Days`},
    ];
  }

  ngOnInit() {
    this.registrationForm = this.fb.group({
      mode: new FormControl('expiry'),
      counter: new FormControl(24, Validators.required),
      unit: new FormControl('hours', Validators.required)
    });
  }

  getNewCode() {
    let expiry = null;
    if (this.registrationForm.controls.mode.value === 'expiry') {
      if (this.registrationForm.controls.unit.value === 'days') {
        expiry = this.registrationForm.controls.counter.value * 24 * 60 * 60;
      } else if (this.registrationForm.controls.unit.value === 'hours') {
        expiry = this.registrationForm.controls.counter.value * 60 * 60;
      } else {
        console.error('Uknown time unit: ', this.registrationForm.controls.unit.value);
      }
    } else if (this.registrationForm.controls.mode.value === 'no_expiry') {

    } else {
      console.error('Unknown expiry mode: ', this.registrationForm.controls.mode.value);
    }

    this.userService.generateRegistrationCode(this.user.id, expiry)
      .subscribe(code => {
        this.registrationCode = code.code.match(/.{1,3}/g).join('-');
      });
  }

  onClickClose(): void {
    this.dialogRef.close();
  }

  onModeChanged(event) {
    if (event.value === 'expiry') {
      this.registrationForm.controls.counter.setValidators(Validators.required);
      this.registrationForm.controls.unit.setValidators(Validators.required);
      this.registrationForm.controls.counter.enable();
      this.registrationForm.controls.unit.enable();
    } else {
      this.registrationForm.controls.counter.clearValidators();
      this.registrationForm.controls.counter.disable();
      this.registrationForm.controls.unit.disable();
    }
  }

  copyText(val: string) {
    this.clipboard.copy(val);

    this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.snackDuration});
  }
}
