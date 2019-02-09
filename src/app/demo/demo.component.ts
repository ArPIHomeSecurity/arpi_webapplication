import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';

import { DemoHelpDialogComponent } from './demo.help.dialog.component';
import { SensorService } from '../services';

import { environment } from '../../environments/environment';

@Component({
  selector: 'app-demo',
  templateUrl: './demo.component.html',
  styleUrls: ['./demo.component.scss']
})
export class DemoComponent implements OnInit {

  channels: boolean[] = [];
  constructor(
    public dialog: MatDialog,
    private sensorService: SensorService
  ) { }

  ngOnInit() {
    // channels are numbered 1..15
    for (let i = 0; i < environment.channel_count; i++) {
      this.channels.push(false);
    }
  }

  help() {
    const dialogRef = this.dialog.open(DemoHelpDialogComponent, {

    });
  }

  swap(index: number) {
    this.channels[index] = !this.channels[index];
    this.sensorService._alertChannel(index, this.channels[index]);
  }
}
