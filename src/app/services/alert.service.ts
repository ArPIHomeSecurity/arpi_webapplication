import { Observable } from 'rxjs';

import { Alert } from '@app/models';


export interface AlertService {

  getAlerts(): Observable<Alert[]>;

  getAlert(): Observable<Alert>;
}
