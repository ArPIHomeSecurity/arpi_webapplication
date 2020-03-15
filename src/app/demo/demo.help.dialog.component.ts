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

  onResetDemo(){
    sessionStorage.clear();
    localStorage.clear();
    window.location.reload();
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
