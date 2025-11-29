import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { RippleModule } from 'primeng/ripple';
import { SortSelectorItemComponent } from './sort-selector-item/sort-selector-item.component';
import { SortSelectorComponent } from './sort-selector.component';

@NgModule({
  declarations: [SortSelectorComponent, SortSelectorItemComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DropdownModule,

    // primeng
    ButtonModule,
    RippleModule,
  ],
  exports: [SortSelectorComponent, SortSelectorItemComponent],
})
export class SortSelectorModule {}
