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

export function getValue(value: any, attribute: string, defaultValue: any = '') {
  // console.log("Getting attribute:",value,".",attribute," = ",value[attribute]);
  if (value) {
    return (value[attribute] !== null) ? value[attribute] : defaultValue;
  }

  return defaultValue;
}

export const checkUrl = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'OPTIONS' });
    if (!response.ok) {
      console.error('No connection to the security system: ', url);
      return false;
    }
    console.log('Connected to the security system: ', url);
    return true;
  } catch (error) {
    console.error('Failed to connect to the security system: ', url, 'Error: ', error);
    return false;
  }
}

export const createHash = async (text: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(await hashBuffer));
  const hashHex = hashArray.map(b => ('00' + b.toString(16)).slice(-2)).join('');
  return hashHex;
}
