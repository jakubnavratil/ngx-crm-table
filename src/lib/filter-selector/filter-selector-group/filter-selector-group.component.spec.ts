import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterSelectorGroupComponent } from './filter-selector-group.component';

describe('FilterSelectorGroupComponent', () => {
  let component: FilterSelectorGroupComponent;
  let fixture: ComponentFixture<FilterSelectorGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FilterSelectorGroupComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FilterSelectorGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
