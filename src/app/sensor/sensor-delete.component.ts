import { Component, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'sensor-delete-dialog',
  templateUrl: 'sensor-delete.component.html',
})
export class SensorDeleteDialog {

  constructor(
    public dialogRef: MatDialogRef<SensorDeleteDialog>, @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  onNoClick(): void {
    this.dialogRef.close();
  }

}