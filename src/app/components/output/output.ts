import { Component, Inject, Input } from '@angular/core';
import { Output } from '@app/models';
import { OutputService } from '@app/services';


@Component({
  selector: 'component-output',
  templateUrl: 'output.html',
  styleUrls: ['output.scss'],
  providers: []
})
export class OutputComponent {
  @Input() output: Output;
  @Input() disabled: boolean;

  ENDLESS_DURATION = 0;

  longPressActive: boolean = false;

  constructor(
    @Inject('OutputService') private outputService: OutputService,
  ) { }

  onLongPressed() {
    if (this.output.state) {
      this.outputService.deactivateOutput(this.output.id);
    }
    else {
      this.outputService.activateOutput(this.output.id);
    }
  }

  onLongPressAvailable(available: boolean) {
    this.longPressActive = available;
  }
}
