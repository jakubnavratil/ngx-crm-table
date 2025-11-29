import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { ContextMenuModule } from 'primeng/contextmenu';
import { DialogModule } from 'primeng/dialog';
import { MenuModule } from 'primeng/menu';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { RippleModule } from 'primeng/ripple';
import { SidebarModule } from 'primeng/sidebar';
import { SplitterModule } from 'primeng/splitter';
import { TableModule as PrimengTableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { FilterSelectorModule } from '../filter-selector/filter-selector.module';
import { PipesModule } from '../pipes/pipes.module';
import { SearchFieldModule } from '../search-field/search-field.module';
import { SortSelectorModule } from '../sort-selector/sort-selector.module';
import { CrudColumnDef } from './crud-column-def.directive';
import { FilterFieldDirective } from './filter-field.directive';
import { TableDefDirective } from './table-def.directive';
import { TableComponent } from './table.component';

@NgModule({
  declarations: [TableComponent, CrudColumnDef],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,

    // lib
    SortSelectorModule,
    FilterSelectorModule,
    SearchFieldModule,
    PipesModule,
    FilterFieldDirective,
    TableDefDirective,

    // primeng
    ButtonModule,
    RippleModule,
    OverlayPanelModule,
    DialogModule,
    BadgeModule,
    TooltipModule,
    ContextMenuModule,
    PrimengTableModule,
    SidebarModule,
    SplitterModule,
    MenuModule,
  ],
  exports: [
    TableComponent,
    CrudColumnDef,
    FilterFieldDirective,
    TableDefDirective,
  ],
})
export class TableModule {}
