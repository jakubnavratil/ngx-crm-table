import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  forwardRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'ls-search-field',
  templateUrl: './search-field.component.html',
  styleUrls: ['./search-field.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchFieldComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchFieldComponent
  implements OnInit, OnDestroy, ControlValueAccessor
{
  inputVisible = false;

  @ViewChild('searchInput', { static: true })
  input!: ElementRef<HTMLInputElement>;

  private valueSubject$ = new Subject<string | null>();
  private valuePriv?: string | null;
  get value(): string | undefined | null {
    return this.valuePriv;
  }
  set value(v: string | undefined | null) {
    this.valuePriv = v;
    this.valueSubject$.next(v ?? null);
  }

  onChange?: (_: string | null) => void;
  onTouched?: () => void;

  private destroy$ = new Subject<void>();

  constructor() {}

  ngOnInit(): void {
    this.valueSubject$
      .pipe(debounceTime(1000), takeUntil(this.destroy$))
      .subscribe((v) => this.onChange?.(v));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
  }

  writeValue(value: string | null | undefined): void {
    this.valuePriv = value;
  }

  registerOnChange(fn: (v: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  showInput(): void {
    this.inputVisible = true;
    this.focusInput();
  }

  onBlur(): void {
    if (this.valuePriv == null || this.valuePriv === '') {
      this.inputVisible = false;
    }
  }

  clearValue(): void {
    this.valuePriv = null;
    this.onChange?.(this.valuePriv);
    this.focusInput();
  }

  focusInput(): void {
    setTimeout(() => {
      this.input.nativeElement.focus();
    });
  }
}
