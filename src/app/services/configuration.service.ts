import { Observable } from 'rxjs';

import { Option } from '@app/models';

export interface ConfigurationService {

  getOption(option: string, section: string): Observable<Option>;

  setOption(option: string, section: string, value: any): Observable<any>;

  sendTestEmail(): Observable<any>;
  
  sendTestSMS(): Observable<any>;

  testSyren(duration?: number): Observable<any>;
}
