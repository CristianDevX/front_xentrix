import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';

import { environment } from '../../environments/environment';
import { EventDto, EventModel } from '../models/event.model';

@Injectable({ providedIn: 'root' })
export class EventsService {
  // Endpoints:
  //   GET  {apiUrl}/local/events/getAll
  //   GET  {apiUrl}/local/events/get/{id}
  //   POST {apiUrl}/local/events/create
  private readonly base = `${environment.apiUrl}/local/events`;

  constructor(private http: HttpClient) {}

  /** GET /local/events/getAll */
  getAll(): Observable<EventModel[]> {
    return this.http.get(`${this.base}/getAll`, { responseType: 'text' }).pipe(
      map(text => {
        const body = this.parse(text);
        if (typeof body === 'string') throw new Error(body); // el backend devolvió un error como texto
        return Array.isArray(body) ? (body as EventModel[]) : [];
      }),
      catchError(err => this.fail(err))
    );
  }

  /** GET /local/events/get/{id}  → null si no existe */
  getById(id: number): Observable<EventModel | null> {
    return this.http.get(`${this.base}/get/${id}`, { responseType: 'text' }).pipe(
      map(text => {
        const body = this.parse(text);
        if (body === null) return null;
        if (typeof body === 'string') throw new Error(body);
        if (Array.isArray(body)) return (body[0] as EventModel) ?? null;
        return body as EventModel;
      }),
      catchError(err => this.fail(err))
    );
  }

  /** POST /local/events/create → devuelve el mensaje que responde el backend */
  create(payload: EventDto): Observable<string> {
    return this.http.post(`${this.base}/create`, payload, { responseType: 'text' }).pipe(
      map(text => {
        const body = this.parse(text);
        if (typeof body === 'string') {
          // Los errores del controller llegan con HTTP 200: "<paquete>.EventsController - <mensaje>"
          if (/EventsController\s-\s/.test(body)) throw new Error(body);
          return body;
        }
        return this.extractMessage(body);
      }),
      catchError(err => this.fail(err))
    );
  }

  /** Convierte el texto de la respuesta a JSON; si no es JSON, lo deja como texto. */
  private parse(text: string | null): unknown {
    if (text == null || text.trim() === '') return null;
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  /** Obtiene el mensaje de una respuesta JSON del backend. */
  private extractMessage(body: unknown): string {
    if (body === null) return 'Evento creado correctamente.';
    if (typeof body === 'object') {
      const obj = body as Record<string, unknown>;
      for (const key of ['message', 'mensaje', 'msg', 'response', 'result', 'detail']) {
        if (typeof obj[key] === 'string' && obj[key]) return obj[key] as string;
      }
      return JSON.stringify(body, null, 2);
    }
    return String(body);
  }

  private fail(err: unknown): Observable<never> {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        return throwError(() => new Error(
          'No hay conexión con el servidor. Verifica que el backend esté en ejecución en el puerto 28080.'));
      }
      return throwError(() => new Error(`Error ${err.status} ${err.statusText} al consultar ${err.url ?? 'el servidor'}`));
    }
    return throwError(() => (err instanceof Error ? err : new Error(String(err))));
  }
}
