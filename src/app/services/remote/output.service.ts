import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Output } from '@app/models';

@Injectable()
export class OutputService {
  constructor(private http: HttpClient) {}

  getOutputs(): Observable<Output[]> {
    // get outputs from api
    return this.http.get<Output[]>('/api/outputs/');
  }

  getOutput(outputId: number): Observable<Output> {
    // get output from api
    return this.http.get<Output>('/api/output/' + outputId);
  }

  createOutput(output: Output): Observable<Output> {
    // create output from api
    return this.http.post<Output>('/api/outputs/', output);
  }

  updateOutput(output: Output): Observable<Output> {
    // update output from api
    return this.http.put<Output>('/api/output/' + output.id, output);
  }

  deleteOutput(outputId: number): Observable<boolean> {
    // delete output from api
    return this.http.delete<boolean>('/api/output/' + outputId);
  }

  activateOutput(outputId: number) {
    return this.http.put('/api/output/' + outputId + '/activate', null).subscribe();
  }

  deactivateOutput(outputId: number) {
    return this.http.put('/api/output/' + outputId + '/deactivate', null).subscribe();
  }

  reorder(outputs: Output[]) {
    return this.http.put('/api/output/reorder', outputs).subscribe();
  }
}
