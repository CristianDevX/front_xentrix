import { Component, HostListener } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidationErrors,
  Validators
} from '@angular/forms';

import { EventDto, EventModel } from './models/event.model';
import { EventsService } from './services/events.service';

type SearchMode = 'none' | 'all' | 'id';

function dateRangeValidator(group: AbstractControl): ValidationErrors | null {
  const open = group.get('eventOpeningDate')?.value;
  const close = group.get('eventClosingDate')?.value;
  if (!open || !close) return null;
  return new Date(close) > new Date(open) ? null : { dateRange: true };
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false
})
export class AppComponent {
  // ---------- Tabla única ----------
  rows: EventModel[] = [];
  mode: SearchMode = 'none';
  searchedId: number | null = null;
  loading = false;
  infoMessage = '';
  idControl = new FormControl<number | null>(null, [Validators.required, Validators.min(1)]);

  // ---------- Formulario de creación ----------
  form = new FormGroup(
    {
      name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(100)] }),
      type: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      capacity: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
      location: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      eventOpeningDate: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      eventClosingDate: new FormControl('', { nonNullable: true, validators: [Validators.required] })
    },
    { validators: dateRangeValidator }
  );
  readonly typeSuggestions = ['Conferencia', 'Concierto', 'Taller', 'Feria', 'Seminario'];

  // ---------- Modales ----------
  confirmOpen = false;
  pending: EventDto | null = null;
  saving = false;

  successOpen = false;
  successMessage = '';

  errorOpen = false;
  errorDetail = '';

  constructor(private eventsService: EventsService) {}

  // =============== Búsquedas ===============

  /** Botón "Buscar todos" → GET /getAll */
  searchAll(): void {
    this.loading = true;
    this.infoMessage = '';
    this.eventsService.getAll().subscribe({
      next: list => {
        this.rows = list;
        this.mode = 'all';
        this.searchedId = null;
        this.infoMessage = list.length === 0 ? 'No hay eventos registrados.' : '';
        this.loading = false;
      },
      error: (e: Error) => {
        this.loading = false;
        this.openError(e.message);
      }
    });
  }

  searchById(): void {
    if (this.idControl.invalid) {
      this.idControl.markAsTouched();
      return;
    }
    const id = this.idControl.value as number;
    this.loading = true;
    this.infoMessage = '';
    this.eventsService.getById(id).subscribe({
      next: ev => {
        this.rows = ev ? [ev] : [];
        this.mode = 'id';
        this.searchedId = id;
        this.infoMessage = ev ? '' : `No se encontró ningún evento con el id ${id}.`;
        this.loading = false;
      },
      error: (e: Error) => {
        this.loading = false;
        this.openError(e.message);
      }
    });
  }

  /** Botón "Limpiar búsqueda" */
  clearSearch(): void {
    this.rows = [];
    this.mode = 'none';
    this.searchedId = null;
    this.infoMessage = '';
    this.idControl.reset();
  }

  get canClear(): boolean {
    return this.mode !== 'none' || this.idControl.value !== null;
  }

  // =============== Crear evento ===============

  /** Submit del formulario → abre el modal de confirmación */
  requestCreate(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.pending = {
      name: v.name.trim(),
      type: v.type.trim(),
      capacity: v.capacity as number,
      location: v.location.trim(),
      // datetime-local no trae zona horaria: se envía como ISO-8601 (UTC)
      eventOpeningDate: new Date(v.eventOpeningDate).toISOString(),
      eventClosingDate: new Date(v.eventClosingDate).toISOString()
    };
    this.confirmOpen = true;
  }

  /** Botón "Confirmar y crear" del modal → POST /create */
  confirmCreate(): void {
    if (!this.pending || this.saving) return;
    this.saving = true;
    this.eventsService.create(this.pending).subscribe({
      next: message => {
        this.saving = false;
        this.confirmOpen = false;
        this.pending = null;
        this.form.reset();
        this.successMessage = message;   // mensaje devuelto por el backend
        this.successOpen = true;
        if (this.mode === 'all') this.searchAll(); // mantiene la tabla al día
      },
      error: (e: Error) => {
        this.saving = false;
        this.confirmOpen = false;
        this.openError(e.message);
      }
    });
  }

  cancelConfirm(): void {
    if (this.saving) return;
    this.confirmOpen = false;
    this.pending = null;
  }

  // =============== Modales ===============

  closeSuccess(): void {
    this.successOpen = false;
    this.successMessage = '';
  }

  openError(detail: string): void {
    this.errorDetail = detail;
    this.errorOpen = true;
  }

  closeError(): void {
    this.errorOpen = false;
    this.errorDetail = '';
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.errorOpen) this.closeError();
    else if (this.successOpen) this.closeSuccess();
    else if (this.confirmOpen) this.cancelConfirm();
  }

  // =============== Utilidades ===============

  invalid(name: string): boolean {
    const c = this.form.get(name);
    return !!c && c.invalid && (c.touched || c.dirty);
  }
}
