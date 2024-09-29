import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ConfigurationService } from '@app/services';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'component-sms-messages-dialog',
  templateUrl: 'sms-messages.component.html',
  styleUrls: ['sms-messages.component.scss']
})
export class SmsMessagesDialogComponent implements OnInit {

  loading = false;
  smsMessages: any = null;

  constructor(
    @Inject('ConfigurationService') private configService: ConfigurationService,

    public dialogRef: MatDialogRef<SmsMessagesDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit(): void {
    this.loading = true;
    this.configService.getSmsMessages().subscribe((smsMessages) => {
      this.smsMessages = smsMessages;
      this.loading = false;
    });
  }

  onDeleteMessage(smsMessage: any): void {
    this.loading = true;
    this.configService.deleteSmsMessage(smsMessage.idx).subscribe(() => {
      this.smsMessages = this.smsMessages.filter((message) => message !== smsMessage);
      this.loading = false;
    });
  }

  onDeleteAllMessages(): void {
    this.loading = true;
    forkJoin(this.smsMessages.map((smsMessage) => this.configService.deleteSmsMessage(smsMessage.idx)))
      .subscribe(() => {
        this.dialogRef.close();
        this.loading = false;
      });
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
