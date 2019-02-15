import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class LoaderService {
  public status: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public message: BehaviorSubject<string> = new BehaviorSubject<string>('');

  constructor () {

  }

  display(value: boolean) {
    this.status.next(value);
  }

  setMessage(message: string) {
    this.message.next(message);
  }

  clearMessage() {
    this.message.next(null);
  }
}
