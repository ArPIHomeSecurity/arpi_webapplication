import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class LoaderService {
  public status: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor () {

  }

  display(value: boolean) {
    console.log('Loader: ', value);
    this.status.next(value);
  }
}
