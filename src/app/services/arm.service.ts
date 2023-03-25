import { Observable } from 'rxjs';

import { Arm, ArmEvent, ARM_TYPE } from '../models';


export interface ArmService {

  getArms(armType: ARM_TYPE, userId: number, startDate: Date, endDate: Date, hasAlert: boolean, offset: number, size: number): Observable<ArmEvent[]>;

  getArmsCount(armType: ARM_TYPE, userId: number, startDate: Date, endDate: Date, hasAlert: boolean): Observable<number>;

  getArm(): Observable<Arm>;
}
