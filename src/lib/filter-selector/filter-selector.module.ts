import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { SelectButtonModule } from 'primeng/selectbutton';
import { FilterSelectorGroupComponent } from './filter-selector-group/filter-selector-group.component';
import { FilterSelectorRuleComponent } from './filter-selector-rule/filter-selector-rule.component';

@NgModule({
  declarations: [FilterSelectorRuleComponent, FilterSelectorGroupComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,

    // primeng
    ButtonModule,
    RippleModule,
    InputTextModule,
    DropdownModule,
    SelectButtonModule,
    CalendarModule,
    InputNumberModule,
  ],
  exports: [FilterSelectorRuleComponent, FilterSelectorGroupComponent],
})
export class FilterSelectorModule {}
