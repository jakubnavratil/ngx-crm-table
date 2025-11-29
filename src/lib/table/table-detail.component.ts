import {
  Directive,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  inject,
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import {
  BehaviorSubject,
  Observable,
  Subject,
  audit,
  delay,
  filter,
  of,
  share,
  switchAll,
  takeUntil,
} from 'rxjs';
import { markAllFieldsDirty } from '../utils/utils';
import { CrudTableService } from './crud-table.service';
import { ExtractFormDataLib, ExtractServiceTypeLib } from './types';

@Directive({
  selector: 'ls-table-detail',
})
export abstract class TableDetailComponent<
    Service extends CrudTableService<
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      DetailValue,
      CreateData,
      UpdateData
    >,
    FormData extends {} = ExtractFormDataLib<Service>,
    DetailValue extends {
      id: number | string;
    } = ExtractServiceTypeLib<Service>['DetailValue'],
    CreateData = ExtractServiceTypeLib<Service>['CreateData'],
    UpdateData = ExtractServiceTypeLib<Service>['UpdateData'],
    KKK extends FormGroup = FormGroup,
  >
  implements OnInit, OnDestroy, OnChanges
{
  constructor() {
    this.detail$
      .pipe(
        audit((detail) => {
          return this.saving$.pipe(filter((v) => !v));
        }),
        takeUntil(this.destroy$),
      )
      .subscribe((r) => {
        this.detail = r ?? undefined;
      });
  }

  abstract readonly service: Service;
  readonly confirmationService = inject(ConfirmationService);
  readonly messageService = inject(MessageService);
  readonly fb = inject(FormBuilder);
  readonly dialogRef = inject(DynamicDialogRef, { optional: true });
  readonly dialogData = inject(DynamicDialogConfig, { optional: true });

  @Input()
  id?: number;

  private _detail?: DetailValue;
  @Input()
  set detail(value: DetailValue | undefined) {
    this._detail = value;
    this.prepareFormWithData(value);
  }
  get detail(): DetailValue | undefined {
    return this._detail;
  }

  form!: ReturnType<this['createForm']>;
  initialValues!: ReturnType<this['createForm']>['value'];

  detailChanges$ = new Subject<Observable<DetailValue | undefined>>();
  detail$ = this.detailChanges$.pipe(
    // delay so ngOnInit can run
    delay(0),
    switchAll(),
    share(),
  );

  destroy$ = new Subject<void>();
  saving$ = new BehaviorSubject(false);

  ngOnInit(): void {
    this.form = this.createForm() as any;
    this.initialValues = this.form.value;

    // accept id from dialog
    if (this.dialogRef != null) {
      if (this.id == null && this.dialogData?.data?.id != null) {
        this.id = this.dialogData.data.id;
      }

      this.reload();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.id) {
      this.reload();
    }
  }

  reload(): void {
    if (this.id != null) {
      this.detailChanges$.next(
        this.service.detailValue({ id: String(this.id) }),
      );
    } else {
      this.detailChanges$.next(of(undefined));
    }
  }

  async prepareData() {}
  async prepareFormWithData(detail?: DetailValue) {
    if (!detail) {
      this.form.reset(this.initialValues);
    }

    await this.prepareData();

    if (!detail) {
      return;
    }

    const formData = await this.fillForm()(detail);
    this.form.reset(formData);
  }

  abstract createForm(): FormGroup;
  abstract fillForm(): (
    detail: DetailValue,
  ) =>
    | ReturnType<this['createForm']>['value']
    | Promise<ReturnType<this['createForm']>['value']>;

  parseDetail(
    fn: (
      detail: DetailValue,
    ) =>
      | ReturnType<this['createForm']>['value']
      | Promise<ReturnType<this['createForm']>['value']>,
  ) {
    return fn;
  }

  prepareSaveData(data: CreateData & UpdateData) {
    return data;
  }

  getSaveData(): (CreateData & UpdateData) | Promise<CreateData & UpdateData> {
    const { ...data } = {
      ...this.form.value,
    };
    return data;
  }

  getCreateData(): CreateData | Promise<CreateData> {
    return this.getSaveData();
  }

  getUpdateData(): UpdateData | Promise<UpdateData> {
    return this.getSaveData();
  }

  async afterSave(id: string | number) {}
  async beforeSave() {}

  async save(close = true): Promise<string | number | false> {
    markAllFieldsDirty(this.form);
    if (!this.form.valid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Chyba',
        detail: 'Opravte data ve formuláři',
        life: 3000,
      });
      return false;
    }

    this.saving$.next(true);

    try {
      let savedData: DetailValue;

      await this.beforeSave();

      if (this.detail != null) {
        const result = await this.service.updateValue(
          this.id!,
          await this.getUpdateData(),
        );
        if (result == null) {
          return false;
        }

        savedData = result;
      } else {
        const result = await this.service.createValue(
          await this.getCreateData(),
        );
        if (result == null) {
          return false;
        }

        savedData = result;
      }

      await this.afterSave(savedData.id);

      if (close) {
        // reset detail at the end
        this.detail = undefined;
        this.close(savedData);
      } else {
        // set detail after create
        if (this.detail == null) {
          this.detail = savedData;
          this.id = Number(savedData.id);
          this.reload();
        }
      }

      this.messageService.add({
        severity: 'success',
        summary: 'Uloženo',
        detail: 'Záznam uložen',
        life: 3000,
      });

      return savedData.id;
    } catch (e) {
      this.messageService.add({
        severity: 'error',
        summary: 'Chyba',
        detail: 'Záznam se nepodařilo uložit',
        life: 3000,
      });
      console.log(e);

      return false;
    } finally {
      this.saving$.next(false);
    }
  }

  delete(close = true): void {
    if (!this.detail) {
      return;
    }
    const detail = this.detail;

    this.confirmationService.confirm({
      message: 'Opravdu chcete smazat záznam?',
      header: 'Smazat?',
      icon: 'pi pi-exclamation-triangle text-red-500',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text p-button-plain',
      acceptLabel: 'Smazat',
      rejectLabel: 'Zrušit',
      defaultFocus: 'reject',
      accept: async () => {
        const result = await this.service.delete({
          input: { id: String(detail.id) },
        });

        if (result) {
          if (close) {
            this.close(false);
          }
          this.messageService.add({
            severity: 'success',
            summary: 'Smazání',
            detail: 'Záznam smazán',
            life: 3000,
          });
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Chyba',
            detail: 'Záznam se nepodařilo smazat',
            life: 3000,
          });
        }
      },
    });
  }

  /**
   * @param detail false means closing after delete
   * @returns
   */
  close(detail?: DetailValue | false): void {
    if (this.dialogRef) {
      this.dialogRef.close(detail);
      return;
    }

    this.service.closeDialog();
  }
}
