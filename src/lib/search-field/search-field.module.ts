import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { SearchFieldComponent } from './search-field.component';

@NgModule({
  declarations: [SearchFieldComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,

    // primeng
    ButtonModule,
    RippleModule,
    InputTextModule,
  ],
  exports: [SearchFieldComponent],
})
export class SearchFieldModule {}
