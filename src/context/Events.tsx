import { ReactNode, createContext, useState } from 'react';
import { UnionOmit } from '../utils/types';
import { EVENT_COLORS } from './useEvent';

export type Event = {
  id: string;
  name: string;
  color: (typeof EVENT_COLORS)[number];
  date: Date;
} & (
  | { allDay: false; startTime: string; endTime: string }
  | { allDay: true; startTime?: never; endTime?: never }
);
type EventsContext = {
  events: Event[];
  addEvent: (event: UnionOmit<Event, 'id'>) => void;
  updateEvent: (event: UnionOmit<Event, 'id'>, id: string) => void;
  deleteEvent: (eventId: string) => void;
};

type EventsProviderProps = {
  children: ReactNode;
};
export const Context = createContext<EventsContext | null>(null);

export function EventsProvider({ children }: EventsProviderProps) {
  const [events, setEvents] = useState<Event[]>([]);
  function addEvent(event: UnionOmit<Event, 'id'>) {
    setEvents(pre => [...pre, { ...event, id: crypto.randomUUID() }]);
  }

  function updateEvent(event: UnionOmit<Event, 'id'>, id: string) {
    setEvents(pre => pre.map(e => (e.id == id ? { ...event, id } : e)));
  }

  function deleteEvent(eventId: string) {
    setEvents(pre => pre.filter(e => e.id !== eventId));
  }
  return (
    <Context.Provider value={{ events, addEvent, deleteEvent, updateEvent }}>
      {children}
    </Context.Provider>
  );
}
