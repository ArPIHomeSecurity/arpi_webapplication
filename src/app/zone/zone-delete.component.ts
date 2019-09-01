import { Component, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'app-zone-delete-dialog',
  templateUrl: 'zone-delete.component.html',
})
export class ZoneDeleteDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<ZoneDeleteDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  onNoClick(): void {
    this.dialogRef.close();
  }

}
