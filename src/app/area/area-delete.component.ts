import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-area-delete-dialog',
  templateUrl: 'area-delete.component.html',
})
export class AreaDeleteDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<AreaDeleteDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
