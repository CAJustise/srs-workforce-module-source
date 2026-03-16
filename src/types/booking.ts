export type ReservationPanelType = 'dining' | 'events' | 'classes';

export interface ReservationIntent {
  requestId: number;
  type: ReservationPanelType;
  eventId?: string;
}
