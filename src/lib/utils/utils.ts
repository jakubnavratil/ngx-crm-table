import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';

export const existing = <T>(c: T): c is Exclude<T, undefined> => !!c;

export function markAllFieldsDirty(formGroup: UntypedFormGroup): void {
  Object.keys(formGroup.controls).forEach((field) => {
    const control = formGroup.get(field);
    if (control instanceof UntypedFormControl) {
      // control.markAsDirty({ onlySelf: true });
      control.markAsDirty();
    } else if (control instanceof UntypedFormGroup) {
      markAllFieldsDirty(control);
    }
  });
}
