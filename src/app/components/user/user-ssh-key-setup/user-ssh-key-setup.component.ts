import { Clipboard } from '@angular/cdk/clipboard';
import { Component, Inject, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { User } from '@app/models';
import { UserService } from '@app/services';

import { environment } from '@environments/environment';

@Component({
  selector: 'app-user-ssh-key-setup',
  templateUrl: './user-ssh-key-setup.component.html',
  styleUrl: './user-ssh-key-setup.component.scss'
})
export class UserSshKeySetupDialogComponent implements OnInit {
  setupKeyForm: FormGroup
  keyTypes: any[]
  setupMethods: any[]
  privateKey: string = null
  loading: boolean

  constructor(
    @Inject('UserService') public userService: UserService,
    public dialogRef: MatDialogRef<UserSshKeySetupDialogComponent>, @Inject(MAT_DIALOG_DATA) public user: User,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private clipboard: Clipboard
  ) {
    this.keyTypes = [
      { value: 'rsa', viewValue: 'RSA' },
      { value: 'ed25519', viewValue: 'ED25519' },
    ];

    this.setupMethods = [
      { value: 'custom', viewValue: 'Custom' },
      { value: 'generate', viewValue: 'Generate' },
    ];
  }

  ngOnInit(): void {
    this.setupKeyForm = this.fb.group({
      setupMethod: ['generate'],
      keyType: ['ed25519'],
      passphrase: [''],
      publicKey: ['']
    });
  }

  onChangeSetupMethod(event: any) {
    const form = this.setupKeyForm;
    if (event.value === 'generate') {
      form.controls.publicKey.disable();
      form.controls.keyType.enable();
      form.controls.passphrase.enable();
    } else {
      form.controls.publicKey.enable();
      form.controls.keyType.disable();
      form.controls.passphrase.disable();
    }
  }

  generateKey() {
    this.loading = true;
    this.userService.generateSshKey(this.user.id, this.setupKeyForm.value.keyType, this.setupKeyForm.value.passphrase)
      .subscribe((key: string) => {
        this.privateKey = key;
        this.loading = false;
      });
  }

  setPublicKey() {
    this.loading = true;
    this.userService.setPublicKey(this.user.id, this.setupKeyForm.value.publicKey)
      .subscribe(() => {
        this.loading = false;
        this.dialogRef.close();
      });
  }

  onCopyKey(value: string) {
    this.clipboard.copy(value);

    this.snackBar.open($localize`:@@copied to clipboard:Copied to clipboard!`, null, { duration: environment.snackDuration });
  }

  onClickClose() {
    this.dialogRef.close();
  }
}
