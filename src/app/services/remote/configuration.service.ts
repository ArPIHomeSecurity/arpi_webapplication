import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Option } from '@app/models';


@Injectable()
export class ConfigurationService implements ConfigurationService {
  constructor(
    private http: HttpClient
  ) { }


  getOption(option: string, section: string): Observable<Option> {
    // get configuration option from api
    return this.http.get<Option>('/api/config/' + option + '/' + section);
  }


  setOption(option: string, section: string, value: any): Observable<any> {
    // get configuration option from api
    return this.http.put('/api/config/' + option + '/' + section, value);
  }

  sendTestEmail() {
    return this.http.get('/api/config/test_email');
  }

  sendTestSMS() {
    return this.http.get('/api/config/test_sms');
  }

  testSyren(duration?: number) {
    const params = duration ?
      new HttpParams().set('duration', duration)
      :
      null;
    return this.http.get('/api/config/test_syren', { params });
  }
}
