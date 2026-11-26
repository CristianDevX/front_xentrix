/** Entidad devuelta por el backend (Events). Las fechas pueden llegar como epoch (number) o ISO (string). */
export interface EventModel {
  id: number;
  name: string;
  type: string;
  capacity: number;
  location: string;
  eventOpeningDate: string | number;
  eventClosingDate: string | number;
}

/** Cuerpo enviado a POST /local/events/create (EventDto). */
export type EventDto = Omit<EventModel, 'id'>;
