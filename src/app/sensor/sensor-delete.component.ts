import { Component, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-sensor-delete-dialog',
  templateUrl: 'sensor-delete.component.html',
})
export class SensorDeleteDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<SensorDeleteDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  onNoClick(): void {
    this.dialogRef.close();
  }

}
