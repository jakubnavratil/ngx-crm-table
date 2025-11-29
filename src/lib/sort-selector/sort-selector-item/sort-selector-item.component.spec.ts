import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SortSelectorItemComponent } from './sort-selector-item.component';

describe('SortSelectorItemComponent', () => {
  let component: SortSelectorItemComponent;
  let fixture: ComponentFixture<SortSelectorItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SortSelectorItemComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SortSelectorItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
