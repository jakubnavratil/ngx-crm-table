import { Directive, Input, TemplateRef } from '@angular/core';

@Directive({
  selector: '[appCrudColumnDef]',
})
export class CrudColumnDef {
  @Input('appCrudColumnDef')
  name!: string;

  constructor(public template: TemplateRef<any>) {}
}
