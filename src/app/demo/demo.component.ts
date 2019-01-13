import { Component, OnInit } from '@angular/core';

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
    private sensorService: SensorService
  ) { }

  ngOnInit() {
    // channels are numbered 1..15
    for (let i = 1; i <= environment.channel_count; i++) {
      this.channels.push(false);
    }
  }

  swap(index: number) {
    console.log('Index: ', index, 'value: ', this.channels[index]);
    this.channels[index] = !this.channels[index];
    this.sensorService._alertSensor(index, this.channels[index]);
  }
}
