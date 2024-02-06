import { Observable } from 'rxjs';

import { Output } from '../models';


export interface OutputService {

  getOutputs(): Observable<Output[]>;

  getOutput(outputId: number): Observable<Output>;

  createOutput(output: Output): Observable<Output>;

  updateOutput(output: Output): Observable<Output>;

  deleteOutput(outputId: number): Observable<boolean>;

  reorder(outputs: Output[]);
}
