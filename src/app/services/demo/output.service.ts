import { Inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';

import { getSessionValue, setSessionValue } from '@app/utils';
import { Output } from '@app/models';
import { OUTPUTS } from '@app/demo/configuration';

import { environment } from '@environments/environment';
import { AUTHENTICATION_SERVICE } from '@app/tokens';
import { EventService } from './event.service';
import { AuthenticationService } from './authentication.service';

@Injectable()
export class OutputService {
  outputs: Output[] = [];

  constructor(
    @Inject(AUTHENTICATION_SERVICE) private authService: AuthenticationService,
    @Inject('EventService') private eventService: EventService
  ) {
    this.outputs = getSessionValue('OutputService.outputs', OUTPUTS);
  }

  getOutputs(): Observable<Output[]> {
    return of(Object.assign([], this.outputs)).pipe(
      delay(environment.delay),
      map(_ => {
        this.authService.updateUserToken('user.session');
        return _;
      })
    );
  }

  getOutput(outputId: number): Observable<Output> {
    return of(
      Object.assign(
        {},
        this.outputs.find(s => s.id === outputId)
      )
    );
  }

  createOutput(output: Output): Observable<Output> {
    // get the maximum id and increment it
    output.id = Math.max.apply(Math.max, this.outputs.map(o => o.id).concat([0])) + 1;

    this.outputs.push(output);
    setSessionValue('OutputService.outputs', this.outputs);
    return of(output);
  }

  updateOutput(output: Output): Observable<Output> {
    const tmpOutput = this.outputs.find(o => o.id === output.id);
    const index = this.outputs.indexOf(tmpOutput);
    this.outputs[index] = output;
    setSessionValue('OutputService.outputs', this.outputs);
    return of(output);
  }

  deleteOutput(outputId: number): Observable<boolean> {
    this.outputs = this.outputs.filter(o => o.id !== outputId);
    setSessionValue('OutputService.output', this.outputs);
    return of(true);
  }

  activateOutput(outputId: number) {
    const tmpOutput = this.outputs.find(o => o.id === outputId);
    if (tmpOutput) {
      tmpOutput.state = !tmpOutput.defaultState;
      this.eventService.updateOutputState(tmpOutput);
      setTimeout(
        () => {
          tmpOutput.state = tmpOutput.defaultState;
          this.eventService.updateOutputState(tmpOutput);
        },
        tmpOutput.delay * 1000 + tmpOutput.duration * 1000
      );
    }

    return of(true);
  }

  deactivateOutput(outputId: number) {
    return of(true);
  }

  reorder(outputs: Output[]) {
    return of(true);
  }
}
