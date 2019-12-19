import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-demo-help-dialog',
  templateUrl: 'demo.help.dialog.html',
})
export class DemoHelpDialogComponent {

  constructor(
      public dialogRef: MatDialogRef<DemoHelpDialogComponent>
  ) {

  }

  onClose(): void {
    this.dialogRef.close();
  }
}
