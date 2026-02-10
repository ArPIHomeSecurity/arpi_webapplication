import { Clipboard } from '@angular/cdk/clipboard';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { environment } from '@environments/environment';

interface MCPTokenDialogData {
  title: string;
  token: string;
}

@Component({
  selector: 'app-mcp-token-dialog',
  templateUrl: './mcp-token-dialog.component.html',
  styleUrls: ['./mcp-token-dialog.component.scss'],
  standalone: false
})
export class MCPTokenDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<MCPTokenDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MCPTokenDialogData,
    private snackBar: MatSnackBar,
    private clipboard: Clipboard
  ) {}

  copyToken() {
    this.clipboard.copy(this.data.token);
    this.snackBar.open($localize`:@@copied to clipboard:Copied to clipboard!`, null, {
      duration: environment.snackDuration
    });
  }

  onClickClose(): void {
    this.dialogRef.close();
  }
}
