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
