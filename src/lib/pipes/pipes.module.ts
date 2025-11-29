import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { DeepValuePipe } from './deep-value.pipe';
import { SafePipe } from './safe.pipe';
import { TruncatePipe } from './truncate.pipe';

@NgModule({
  declarations: [DeepValuePipe, SafePipe, TruncatePipe],
  imports: [CommonModule],
  exports: [DeepValuePipe, SafePipe, TruncatePipe],
})
export class PipesModule {}
