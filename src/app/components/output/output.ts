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
  @Input() output:Output;
  @Input() disabled:boolean;

  ENDLESS_DURATION = 0;

  constructor(
    @Inject('OutputService') private outputService: OutputService,
  ) { }

  onToggleButton(output: Output) {
    if (output.state) {
      this.outputService.deactivateOutput(output.id);
    }
    else {
      this.outputService.activateOutput(output.id);
    }
  }
}
