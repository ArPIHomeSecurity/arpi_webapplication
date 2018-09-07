import { Component, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'zone-delete-dialog',
  templateUrl: 'zone-delete.component.html',
})
export class ZoneDeleteDialog {

  constructor(
    public dialogRef: MatDialogRef<ZoneDeleteDialog>, @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  onNoClick(): void {
    this.dialogRef.close();
  }

}