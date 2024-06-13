import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { DemoHelpDialogComponent } from './demo.help.dialog.component';
import { SensorService, CardService } from '@app/services/demo';
import { getSessionValue, setSessionValue } from '@app/utils';

import { environment } from '@environments/environment';

@Component({
  selector: 'app-demo',
  templateUrl: './demo.component.html',
  styleUrls: ['./demo.component.scss']
})
export class DemoComponent implements OnInit {

  channels: boolean[] = [];
  constructor(
    public dialog: MatDialog,
    @Inject('SensorService')private sensorService: SensorService,
    @Inject('CardService') private cardService: CardService
  ) {
    const channels: boolean[] = [];
    // channels are numbered 1..N
    for (let i = 0; i < environment.channelCount; i++) {
      channels.push(false);
    }

    this.channels = getSessionValue('DemoComponent.channels', channels);
  }

  ngOnInit() {
    const appRoot = document.getElementsByTagName('app-root')[0];
    if (appRoot) {
      appRoot.classList.add('demo');
    }
  }

  help() {
    this.dialog.open(DemoHelpDialogComponent, {});
  }

  putCard(cardId: number) {
    this.cardService.onCard(cardId);
  }

  toogleChannel(index: number) {
    this.channels[index] = !this.channels[index];
    setSessionValue('DemoComponent.channels', this.channels);
    this.sensorService.alertChannel(index, this.channels[index]);
  }
}
