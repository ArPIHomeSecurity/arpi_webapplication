import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-user-device-unregister-dialog',
  templateUrl: 'user-device-unregister.component.html',
})
export class UserDeviceUnregisterDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<UserDeviceUnregisterDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
