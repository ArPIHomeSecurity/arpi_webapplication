import { ValidatorFn, ValidationErrors } from '@angular/forms';
import { AbstractControl } from '@angular/forms';

export function positiveInteger(): ValidatorFn {
  return (control: AbstractControl): {[key: string]: any} => {
    const error: ValidationErrors = { integer: true };
    if (control.value === `${parseInt(control.value, 10)}`) {
      if (Number(control.value) < 0) {
        return {invalid: 'Should be a positive value!'};;
      } else {
        return null;
      }
    } else {
      return {invalid: 'Invalid value!'};
    }
  };
}
