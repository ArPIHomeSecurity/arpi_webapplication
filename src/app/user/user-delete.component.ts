import { Component, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'user-delete-dialog',
  templateUrl: 'user-delete.component.html',
})
export class UserDeleteDialog {

  constructor(
    public dialogRef: MatDialogRef<UserDeleteDialog>, @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  onNoClick(): void {
    this.dialogRef.close();
  }

}