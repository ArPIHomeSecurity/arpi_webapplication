import { Observable } from 'rxjs';

import { Option } from '../models';

export interface ConfigurationService {

  getOption( option: string, section: string ): Observable<Option>;

  setOption( option: string, section: string, value: any ): Observable<any>;
}
