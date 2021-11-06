import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';


export interface LoaderService {
  displayed: BehaviorSubject<boolean>;
  disabled: BehaviorSubject<boolean>;
  message: BehaviorSubject<string>;

  display(value: boolean);

  disable(value: boolean);

  setMessage(message: string);

  clearMessage();
}
