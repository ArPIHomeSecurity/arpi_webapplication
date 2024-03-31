import { Observable } from 'rxjs';

import { ARM_TYPE, Area } from '@app/models';


export interface AreaService {

  getAreas(): Observable<Area[]>;

  getArea( areaId: number ): Observable<Area>;

  createArea( area: Area ): Observable<Area>;

  updateArea( area: Area ): Observable<Area>;

  deleteArea( areaId: number ): Observable<boolean>;

  arm(areaId: number, armtype: ARM_TYPE): Observable<Object>;

  disarm(areaId: number): Observable<Object>;

  reorder(areas: Area[]);
}
