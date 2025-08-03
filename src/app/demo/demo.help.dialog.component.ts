import { Component, TemplateRef, ViewChild } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-demo-help-dialog',
  templateUrl: 'demo.help.dialog.component.html',
  styleUrls: ['demo.help.dialog.component.scss'],
  standalone: false
})
export class DemoHelpDialogComponent {
  readonly ADMIN_REGISTRATION_CODE = 'ABC-DEF-000-001';
  readonly USER_REGISTRATION_CODE = 'ABC-DEF-000-002';
  readonly ADMIN_ACCESS_CODE = '1234';
  readonly USER_ACCESS_CODE = '1111';

  displayedColumns: string[] = ['someValue', 'someOtherValue'];

  constructor(
    public dialogRef: MatDialogRef<DemoHelpDialogComponent>,
    private clipboard: Clipboard,
    private snackBar: MatSnackBar
  ) {}

  onResetDemo() {
    sessionStorage.clear();
    localStorage.clear();
    window.location.reload();
  }

  copyToClipboard(text: string) {
    this.clipboard.copy(text);

    this.snackBar.open($localize`:@@copied to clipboard:Copied to clipboard!`, null, {
      duration: environment.snackDuration
    });
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
