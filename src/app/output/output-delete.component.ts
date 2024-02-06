import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-output-delete-dialog',
  templateUrl: 'output-delete.component.html',
})
export class OutputDeleteDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<OutputDeleteDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
