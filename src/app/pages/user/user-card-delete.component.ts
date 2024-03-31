import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-user-card-delete-dialog',
  templateUrl: 'user-card-delete.component.html',
})
export class UserCardDeleteDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<UserCardDeleteDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
