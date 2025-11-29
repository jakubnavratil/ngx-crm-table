import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterSelectorRuleComponent } from './filter-selector-rule.component';

describe('FilterSelectorRuleComponent', () => {
  let component: FilterSelectorRuleComponent;
  let fixture: ComponentFixture<FilterSelectorRuleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FilterSelectorRuleComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FilterSelectorRuleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
