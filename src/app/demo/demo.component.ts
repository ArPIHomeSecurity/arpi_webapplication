import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';

import { DemoHelpDialogComponent } from './demo.help.dialog.component';
import { SensorService } from '../services';
import { getSessionValue, setSessionValue } from '../utils';

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
  ) {
    const channels: boolean[] = [];
    // channels are numbered 1..N
    for (let i = 0; i < environment.channel_count; i++) {
      channels.push(false);
    }

    this.channels = getSessionValue('DemoComponent.channels', channels);
  }

  ngOnInit() {

  }

  help() {
    this.dialog.open(DemoHelpDialogComponent, {});
  }

  swap(index: number) {
    this.channels[index] = !this.channels[index];
    setSessionValue('DemoComponent.channels', this.channels);
    this.sensorService._alertChannel(index, this.channels[index]);
  }
}
