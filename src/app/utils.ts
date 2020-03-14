import { ValidatorFn, ValidationErrors } from '@angular/forms';
import { AbstractControl } from '@angular/forms';

export function positiveInteger(): ValidatorFn {
  return (control: AbstractControl): {[key: string]: any} => {
    const error: ValidationErrors = { integer: true };
    if (Number(control.value) < 0 || isNaN(Number(control.value))) {
      return {invalid: 'Should be a positive value!'};
    } else {
      return null;
    }
  };
}

export function getSessionValue(name: string, defaultValue: any): any {
  const value = JSON.parse(sessionStorage.getItem(name));
  if (value != null) {
    return value;
  }

  return defaultValue;
}

export function getLocalValue(name: string, defaultValue: any): any {
  const value = JSON.parse(localStorage.getItem(name));
  if (value != null) {
    return value;
  }

  return defaultValue;
}

export function setSessionValue(name: string, value: any) {
  sessionStorage.setItem(name, JSON.stringify(value));
}

export function setLocalValue(name: string, value: any) {
  localStorage.setItem(name, JSON.stringify(value));
}

export function getValue(value: any, attribute: string, default_value: any = '') {
  // console.log("Getting attribute:",value,".",attribute," = ",value[attribute]);
  if (value) {
    return value ? value[attribute] : default_value;
  }
  return default_value;
}
