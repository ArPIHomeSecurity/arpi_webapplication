import { Observable } from 'rxjs';

import { Alert } from '../models';


export interface AlertService {

  getAlerts(): Observable<Alert[]>;

  getAlert(): Observable<Alert>;
}
